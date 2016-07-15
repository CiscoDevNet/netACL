import json
import urllib

from acl_validator import AclValidator
from settings import logger
from backend.util.errors import ValidationError
from backend.util.exceptions import HttpClientException
from utils import validate_acl_name
from urls import StandardAclUrlDispatcher
from backend.util.http_client import HttpClient
from backend.util.utils import get_protocol


class AclOps(object):
    GET = 'get'
    APPLY = 'apply'
    EDIT = 'edit'
    DELETE = 'delete'

    SUPPORTED_OPS = [GET, APPLY, EDIT, DELETE]


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

    url_dispatcher = StandardAclUrlDispatcher

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
        self.node = None
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

        if self.operation in [AclOps.APPLY, AclOps.DELETE]:
            self.nodes = self.payload.get('node')
            if not self.nodes:
                raise ValueError('No nodes specified')

            self.bind = payload.get('bind')
            if not self.bind or self.bind != 'inbound' and self.bind != 'outbound':
                raise ValueError('No binding specified or invalid format')
        elif self.operation == AclOps.EDIT:
            self.node = self.payload.get('node')
            if not self.node:
                raise ValueError('No node specified')

        self.acl = payload.get('acl')
        if not self.acl:
            raise ValueError('No acl specified')
        if self.operation == AclOps.APPLY \
                and (not isinstance(self.acl.get('ace'), list) or len(self.acl.get('ace'))) == 0:
            raise ValueError('No ace specified or format is wrong')

    @upload_required
    def get_nodes(self):
        return self.nodes

    @upload_required
    def unwrap_payload(self):
        return self.payload

    @staticmethod
    def _fill_interface_template(bind, acl_name, method=HttpClient.PUT):
        payload = {
            bind: {
                "name": acl_name
            }
        }
        return payload if method == HttpClient.PUT else {"Cisco-IOS-XR-ip-pfilter-cfg:ipv4-packet-filter": payload}

    @staticmethod
    def _sort_aces(aces):
        if not all(unicode(ace.get("sequence-number")).isdigit() for ace in aces) \
                or len(set(map(lambda ace: ace.get("sequence-number"), aces))) < len(aces):
            for index, ace in enumerate(aces):
                ace["sequence-number"] = 10 * (index + 1)
            return aces
        else:
            return sorted(aces, key=lambda ace: int(ace.get("sequence-number")))

    @staticmethod
    def _get_aces(acl, parse_mode):
        return AclParserStandard._sort_aces(acl.get('ace')
                                            if parse_mode == AclParserStandard.PARSE
                                            else acl.get("access-list-entries").get("access-list-entry"))

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
    def _fill_acl_template(acl, parse_mode=PARSE, method=HttpClient.POST):

        # Set up direction of parsing ('PARSE' for UI to controller, 'UNPARSE' for controller to UI)
        IN = parse_mode if parse_mode == AclParserStandard.PARSE or parse_mode == AclParserStandard.UNPARSE else 0
        OUT = 1 - IN

        validator = AclValidator()

        # prepare incoming aces for parsing to outcoming
        in_aces = AclParserStandard._get_aces(acl, parse_mode)
        out_aces = []

        for index, ace_entry_in in enumerate(in_aces):
            validator.validate_entry(ace_entry_in)

            ace_entry_out = {
                'protocol': get_protocol(str(ace_entry_in.get("protocol"))),
                'sequence-number': int(ace_entry_in.get("sequence-number")),
                'grant': ace_entry_in.get("grant")
            }

            for direction in ["source", "destination"]:
                # Prepare one-to-one field mapping class
                network_mappings = AclParserStandard.MAPPINGS[direction]

                # Network (address and wild card bits) fields parsing
                network_name = "{}-network".format(direction)
                if network_name in ace_entry_in:
                    network_in = ace_entry_in[network_name]
                    network_out = {}

                    in_address_field = network_mappings.get("address")[IN]
                    out_address_field = network_mappings.get("address")[OUT]

                    address = network_in.get(in_address_field)

                    if address and address != "any":
                        validator.validate_ip(in_address_field, address)
                        network_out[out_address_field] = address

                        wild_card_bits = network_in.get(network_mappings.get("wild-card-bits")[IN])
                        if wild_card_bits and wild_card_bits != "any":
                            validator.validate_ip(network_mappings.get("wild-card-bits")[IN], wild_card_bits)
                            if wild_card_bits != "0.0.0.0":
                                network_out[network_mappings.get("wild-card-bits")[OUT]] = wild_card_bits
                        else:
                            network_out[network_mappings.get("wild-card-bits")[OUT]] = "0.0.0.0"

                    if network_out != {}:
                        ace_entry_out[network_name] = network_out

                # Port (numbers and operator if present) fields parsing
                port_name = "{}-port".format(direction)
                if port_name in ace_entry_in:
                    in_port = ace_entry_in[port_name]
                    out_port = {}

                    in_port_mode_name = network_mappings.get("port-mode")[IN]
                    in_first_port_name = network_mappings.get("first-port")[IN]
                    in_second_port_name = network_mappings.get("second-port")[IN]

                    if in_port_mode_name in in_port:
                        validator.validate_operator(in_port_mode_name, in_port[in_port_mode_name])
                        out_port[network_mappings.get("port-mode")[OUT]] = in_port[in_port_mode_name]
                        if in_first_port_name in in_port and in_port[in_first_port_name] != "":
                            out_port[network_mappings.get("first-port")[OUT]] = in_port[in_first_port_name]
                        if in_second_port_name in in_port and in_port[in_second_port_name] != "":
                            out_port[network_mappings.get("second-port")[OUT]] = in_port[in_second_port_name]

                    ace_entry_out[port_name] = out_port

            if not validator.is_valid():
                raise ValidationError("Acl entry has wrong format. Sequence number: {}. Error: {}".format(
                    ace_entry_in.get("sequence-number"), validator.get_errors()))

            out_aces.append(ace_entry_out)

        acl_name_dict = {
            AclParserStandard.MAPPINGS.get('acl_name')[OUT]: acl.get(AclParserStandard.MAPPINGS.get('acl_name')[IN])
        }

        out_aces = sorted(out_aces, key=lambda k: k["sequence-number"])
        out_payload = {}

        if parse_mode == AclParserStandard.PARSE:
            # Prepare netconf-valid structure of acls
            out_payload["access"] = [{}]
            out_payload["access"][0].update(acl_name_dict)
            out_payload["access"][0].update({
                "access-list-entries": {
                    "access-list-entry": out_aces
                }
            })

            # POST assumes using a higher level url, so we need to wrap the payload in more layers
            if method == HttpClient.POST:
                out_payload = {
                    "Cisco-IOS-XR-ipv4-acl-cfg:ipv4-acl-and-prefix-list": {
                        "accesses": out_payload
                    }
                }
        else:
            out_payload.update(acl_name_dict)
            out_payload.update({
                "ace": out_aces
            })

        return out_payload

    @upload_required
    def apply_acls(self):
        acl_name = self.acl.get('acl-name')
        validate_acl_name(acl_name)
        http_client = HttpClient()

        for node in self.nodes:
            try:
                acl_payload = self._fill_acl_template(self.acl, self.PARSE, HttpClient.PUT)
                http_client.put(self.url_dispatcher.PUT_ACL_URL.format(node.get('name'), acl_name), acl_payload)
            except HttpClientException as e:
                logger.debug("PUT acl to node failed, trying POST. Error: {}".format(e.message))
                acl_payload = self._fill_acl_template(self.acl, self.PARSE, HttpClient.POST)
                http_client.post(self.url_dispatcher.POST_ACL_URL.format(node.get('name')), acl_payload)

            for interface_name in node.get('interface', []):
                try:
                    interface_payload = self._fill_interface_template(self.bind, acl_name, HttpClient.PUT)
                    interface_url = self.url_dispatcher.PUT_INTERFACE_URL.format(node.get('name'),
                                                                          urllib.quote(interface_name, ''),
                                                                          self.bind)
                    http_client.put(interface_url, interface_payload)
                except HttpClientException as e:
                    logger.debug("PUT acl to interface failed, trying POST. Error: {}".format(e.message))
                    interface_payload = self._fill_interface_template(self.bind, acl_name, HttpClient.POST)
                    interface_url = self.url_dispatcher.POST_INTERFACE_URL.format(node.get('name'),
                                                                   urllib.quote(interface_name, ''))
                    http_client.post(interface_url, interface_payload)

    @upload_required
    def edit_acl(self):
        acl_name = self.acl.get('acl-name')
        validate_acl_name(acl_name)

        acl_payload = self._fill_acl_template(self.acl, self.PARSE, HttpClient.PUT)
        HttpClient().put(self.url_dispatcher.PUT_ACL_URL.format(self.node, acl_name), acl_payload)

    @upload_required
    def delete_acl(self):
        http_client = HttpClient()

        acl_name = self.acl.get('acl-name')
        validate_acl_name(acl_name)

        for node in self.nodes:
            for interface in node.get("interface", []):
                http_client.delete(self.url_dispatcher.DELETE_INTERFACE_URL.format(node.get('name'),
                                                                     urllib.quote(interface, ''),
                                                                     self.bind))
            http_client.delete(self.url_dispatcher.PUT_ACL_URL.format(node.get('name'), acl_name))

    def unparse_acl(self, acl):
        return self._fill_acl_template(acl, self.UNPARSE)
