import urllib

from acl_validator import AclValidator
from backend.util.errors import ValidationError
from utils import validate_acl_name
from urls import interfaces_url, acl_url
from backend.util.http_client import HttpClient
from backend.util.utils import get_protocol, url_join


class AclOps(object):
    GET = 'get'
    APPLY = 'apply'
    DELETE = 'delete'

    SUPPORTED_OPS = [GET, APPLY, DELETE]


def upload_required(func):
    def func_wrapper(*args, **kwargs):
        if len(args) == 0 or not isinstance(args[0], AclParserStandard):
            raise ValueError("Method is not bound")
        if not getattr(args[0], 'payload', None):
            raise ValueError("Payload hasn't yet been uploaded")
        else:
            return func(*args, **kwargs)

    return func_wrapper


class AclParserStandard(object):

    PARSE = 0
    UNPARSE = 1

    INTERFACE_URL = url_join(interfaces_url,
                             '/interface-configuration/act/{}/Cisco-IOS-XR-ip-pfilter-cfg:ipv4-packet-filter/{}')
    PUT_ACL_URL = url_join(acl_url, '/accesses/access/{}')

    MAPPINGS = {
        "acl_name": ('acl-name', 'access-list-name'),
        "source": {
            'address': ('address', 'source-address'),
            'wild-card-bits': ('wild-card-bits', 'source-wild-card-bits'),
            'port-mode': ('port-mode', 'source-operator'),
            'first-port': ('first-port', 'first-source-port'),
            'second-port': ('second-port', 'second-source-port')
        },
        "destination": {
            'address': ('address', 'destination-address'),
            'wild-card-bits': ('wild-card-bits', 'destination-wild-card-bits'),
            'port-mode': ('port-mode', 'destination-operator'),
            'first-port': ('first-port', 'first-destination-port'),
            'second-port': ('second-port', 'second-destination-port')
        }
    }

    def __init__(self, operation='apply'):
        self.payload = None
        self.nodes = []
        self.bind = None
        self.acl = None
        if operation in AclOps.SUPPORTED_OPS:
            self.operation = operation
        else:
            raise ValueError("Operation {} not supported by current acl parser".format(operation))

    def upload_payload(self, payload):

        self.payload = payload
        self.payload = self.unwrap_payload()

        self.nodes = self.payload.get('node')
        if not self.nodes:
            raise ValueError('No nodes specified')

        self.bind = payload.get('bind')
        if not self.bind or self.bind != 'inbound' and self.bind != 'outbound':
            raise ValueError('No binding specified or invalid format')

        self.acl = payload.get('acl')
        if not self.acl:
            raise ValueError('No acl specified')

    @upload_required
    def get_nodes(self):
        return self.nodes

    @upload_required
    def unwrap_payload(self):
        return self.payload

    @staticmethod
    def _fill_interface_template(bind, acl_name):
        return {
            bind: {
                "name": acl_name
            }
        }

    @staticmethod
    def _get_aces(acl, parse_mode):
        return acl.get('ace') if parse_mode == AclParserStandard.PARSE else acl.get("access-list-entries").get("access-list-entry")

    @staticmethod
    def _build_out_aces(aces, parse_mode):
        return {
            "access-list-entries": {
                "access-list-entry": aces
            }
        } if parse_mode == AclParserStandard.PARSE else {
            "ace": aces
        }

    @staticmethod
    def _build_out_payload(acl_name_dict, out_aces, parse_mode):
        out_aces = sorted(out_aces, key=lambda k: k["sequence-number"])
        out_payload = {}
        if parse_mode == AclParserStandard.PARSE:
            out_payload["access"] = [{}]
            out_payload["access"][0].update(acl_name_dict)
            out_payload["access"][0].update({
                "access-list-entries": {
                    "access-list-entry": out_aces
                }
            })
        else:
            out_payload.update(acl_name_dict)
            out_payload.update({
                "ace": out_aces
            })
        return out_payload

    @staticmethod
    def _fill_acl_template(acl, parse_mode=PARSE):
        in_index = parse_mode if parse_mode == AclParserStandard.PARSE or parse_mode == AclParserStandard.UNPARSE else 0
        out_index = 1 - in_index

        validator = AclValidator()

        in_aces = AclParserStandard._get_aces(acl, parse_mode)
        out_aces = []
        for ace_entry_in in in_aces:
            validator.validate_entry(ace_entry_in)

            ace_entry_out = {
                'protocol': get_protocol(str(ace_entry_in.get("protocol"))),
                'sequence-number': int(ace_entry_in.get("sequence-number")),
                'grant': ace_entry_in.get("grant")
            }

            for direction in ["source", "destination"]:
                network_mappings = AclParserStandard.MAPPINGS[direction]

                network_name = "{}-network".format(direction)
                if network_name in ace_entry_in:
                    network_in = ace_entry_in[network_name]
                    network_out = {}

                    in_address_field = network_mappings.get("address")[in_index]
                    out_address_field = network_mappings.get("address")[out_index]

                    address = network_in.get(in_address_field)

                    if address and address != "any":
                        validator.validate_ip(in_address_field, address)
                        network_out[out_address_field] = address

                        wild_card_bits = network_in.get(network_mappings.get("wild-card-bits")[in_index])
                        if wild_card_bits and wild_card_bits != "any":
                            validator.validate_ip(network_mappings.get("wild-card-bits")[in_index], wild_card_bits)
                            if wild_card_bits != "0.0.0.0":
                                network_out[network_mappings.get("wild-card-bits")[out_index]] = wild_card_bits
                        else:
                            network_out[network_mappings.get("wild-card-bits")[out_index]] = "0.0.0.0"

                    if network_out != {}:
                        ace_entry_out[network_name] = network_out

                port_name = "{}-port".format(direction)
                if port_name in ace_entry_in:
                    in_port = ace_entry_in[port_name]
                    out_port = {}

                    in_port_mode_name = network_mappings.get("port-mode")[in_index]
                    in_first_port_name = network_mappings.get("first-port")[in_index]
                    in_second_port_name = network_mappings.get("second-port")[in_index]

                    if in_port_mode_name in in_port:
                        validator.validate_operator(in_port_mode_name, in_port[in_port_mode_name])
                        out_port[network_mappings.get("port-mode")[out_index]] = in_port[in_port_mode_name]
                        if in_first_port_name in in_port and in_port[in_first_port_name] != "":
                            out_port[network_mappings.get("first-port")[out_index]] = in_port[in_first_port_name]
                        if in_second_port_name in in_port and in_port[in_second_port_name] != "":
                            out_port[network_mappings.get("second-port")[out_index]] = in_port[in_second_port_name]

                    ace_entry_out[port_name] = out_port

            if not validator.is_valid():
                raise ValidationError("Acl entry has wrong format. Sequence number: {}. Error: {}".format(
                    ace_entry_in.get("sequence-number"), validator.get_errors()))

            out_aces.append(ace_entry_out)

        acl_name_dict = {
            AclParserStandard.MAPPINGS.get('acl_name')[out_index]: acl.get(AclParserStandard.MAPPINGS.get('acl_name')[in_index])
        }
        return AclParserStandard._build_out_payload(acl_name_dict, out_aces, parse_mode)

    @upload_required
    def apply_acls(self):
        acl_name = self.acl.get('acl-name')
        validate_acl_name(acl_name)

        access_list = self._fill_acl_template(self.acl, self.PARSE)
        http_client = HttpClient()

        for node in self.nodes:
            http_client.put(self.PUT_ACL_URL.format(node.get('name'), acl_name), access_list)

            for interface_name in node.get('interface', []):
                interface_payload = self._fill_interface_template(self.bind, acl_name)
                interface_url = self.INTERFACE_URL.format(node.get('name'),
                                                          urllib.quote(interface_name, ''),
                                                          self.bind)

                http_client.put(interface_url, interface_payload)

    @upload_required
    def delete_acl(self):
        http_client = HttpClient()

        acl_name = self.acl.get('acl-name')
        validate_acl_name(acl_name)

        for node in self.nodes:
            for interface in node.get("interface", []):
                http_client.delete(self.INTERFACE_URL.format(node.get('name'),
                                                             urllib.quote(interface, ''),
                                                             self.bind))
            http_client.delete(self.PUT_ACL_URL.format(node.get('name'), acl_name))

    def unparse_acl(self, acl):
        return self._fill_acl_template(acl, self.UNPARSE)
