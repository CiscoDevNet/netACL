import abc
import json
import os
from json import JSONEncoder

from tornado.httpclient import HTTPError

from backend.apps.acl.utils import is_acl_name_hidden
from backend.util.app_utils import fetch_and_persist
from backend.util.exceptions import HttpClientException
from urls import CommonUrlDispatcher
from settings import logger, acl_path
from backend.settings import interfaces_path
from backend.util.topology_parser import AbstractTopology, ValidationError
from backend.util.utils import html_style, name_check, remove_dup_links


def topology_required(func):
    def func_wrapper(*args, **kwargs):
        if len(args) == 0 or not issubclass(args[0].__class__, AbstractAclTopologyParser):
            raise ValueError("Method is not bound")
        if not getattr(args[0], 'topology', None):
            raise ValueError("Topology hasn't yet been uploaded")
        else:
            return func(*args, **kwargs)
    return func_wrapper


class AbstractAclTopologyParser(object):

    __metaclass__ = abc.ABCMeta

    url_dispatcher = CommonUrlDispatcher

    def add_topo_prefix(self, field):
        topo_prefix = 'l3-unicast-igp-topology'
        return ':'.join([topo_prefix, field])

    @staticmethod
    def fetch_interfaces(node, default=None):
        try:
            return fetch_and_persist(AbstractAclTopologyParser.url_dispatcher.GET_INTERFACES_URL.format(node),
                                     os.path.join(interfaces_path, node + "_interfaces.json"))
        except HTTPError as e:
            logger.exception(e.message)
            return default

    @staticmethod
    def fetch_acl(node, default=None):
        try:
            return fetch_and_persist(AbstractAclTopologyParser.url_dispatcher.GET_ACL_URL.format(node),
                                     os.path.join(acl_path, node + "_acl.json"), default=default)
        except HTTPError as e:
            logger.exception(e.message)
            return default

    def __init__(self):
        self.topology = None

        self.ID = 'id'
        self.INTERFACE = 'interface'
        self.LOOPBACK = 'loopback'
        self.NAME = 'name'
        self.NODE = 'node'
        self.NODE_ID = 'node-id'
        self.PREFIX = 'prefix'
        self.ROUTER = 'router'
        self.ROUTER_ID = 'router-id'

        self.LINK = 'link'
        self.SOURCE = 'source'
        self.DESTINATION = 'destination'
        self.DEST = 'dest'
        self.TP = 'tp'
        self.TARGET = 'target'
        self.METRIC = 'metric'

        self.SOURCE_TP = '-'.join([self.SOURCE, self.TP])
        self.SOURCE_NODE = '-'.join([self.SOURCE, self.NODE])
        self.DEST_TP = '-'.join([self.DEST, self.TP])
        self.DEST_NODE = '-'.join([self.DEST, self.NODE])

        self.NODE_ATTRIBUTES = self.add_topo_prefix('igp-node-attributes')
        self.LINK_ATTRIBUTES = self.add_topo_prefix('igp-link-attributes')
        self.IPV4_INTERFACE = 'Cisco-IOS-XR-ipv4-io-cfg:ipv4-network'
        self.ACL = 'Cisco-IOS-XR-ip-pfilter-cfg:ipv4-packet-filter'
        self.ACL_DETAILS = 'ipv4-acl-and-prefix-list'

    def upload_topology(self, topology):
        self.topology = topology
        self.topology = self._unwrap_topology()

    @abc.abstractmethod
    @topology_required
    def _unwrap_topology(self):
        """ Remove higher unused levels of topology """
        return self.topology

    @abc.abstractmethod
    @topology_required
    def get_topology_id(self):
        """ Get id or name of topology """
        return

    @abc.abstractmethod
    @topology_required
    def parse_nodes(self):
        """ Retrieve and parse all nodes from topology """
        return

    @abc.abstractmethod
    @topology_required
    def parse_links(self):
        """ Retrieve and parse all links from topology """
        return

    @abc.abstractmethod
    def parse_interfaces(self, interfaces):
        """
            Convert interfaces payload received from controller to UI-compatible format
            :argument interfaces - interfaces received from controller
            :return dict - reformatted interfaces
        """
        return

    @abc.abstractmethod
    def get_acls(self, node_name, interface_name, acl_parser):
        """
            Fetch acls for a specific interface.
            :argument node_name
            :argument interface_name
            :argument acl_parser
            :return dict with "inbound" and "outbound" fields either populated with corresponding acls or null
        """
        return


class AclTopologyParserOld(AbstractAclTopologyParser):

    def __init__(self):
        super(AclTopologyParserOld, self).__init__()
        self._PREFIX = self.add_topo_prefix(self.PREFIX)
        self._ROUTER_ID = self.add_topo_prefix(self.ROUTER_ID)
        self._NAME = self.add_topo_prefix(self.NAME)
        self._METRIC = self.add_topo_prefix(self.METRIC)

    @topology_required
    def _unwrap_topology(self):
        return self.topology['topology'][0] if len(self.topology.get('topology', [])) > 0 else self.topology

    @topology_required
    def get_topology_id(self):
        return self.topology.get('topology-id')

    @topology_required
    def parse_nodes(self):
        node_list = []

        for controller_node in self.topology[self.NODE]:
            node = {}
            prefix_array = []
            node_dict = html_style(controller_node[self.NODE_ID])
            attributes = controller_node[self.NODE_ATTRIBUTES]

            if self._PREFIX in attributes:
                for prefix in attributes[self._PREFIX]:
                    prefix_array.append(prefix[self._PREFIX])
            node[self.PREFIX] = prefix_array

            if self._ROUTER_ID in attributes:
                if self._NAME in attributes:
                    node[self.NAME] = attributes[self._NAME]
                else:
                    success, name = name_check(attributes[self._ROUTER_ID][0])
                    node[self.NAME] = name if success else node_dict[self.ROUTER]
                node[self.LOOPBACK] = attributes[self._ROUTER_ID][0]
            else:
                node[self.NAME] = node_dict[self.ROUTER]
                node[self.LOOPBACK] = "0.0.0.0"
            node[self.ID] = controller_node[self.NODE_ID]

            node_list.append(node)

        for node in node_list:
            node_dict = html_style(node[self.ID])
            if node[self.NAME] == node_dict[self.ROUTER] and node[self.LOOPBACK] == "0.0.0.0":
                for owner in node_list:
                    owner_dict = html_style(owner[self.ID])
                    if node[self.NAME][:len(owner_dict[self.ROUTER])] == owner_dict[self.ROUTER] and node[self.NAME] != owner[self.NAME]:
                        node[self.NAME] = owner[self.NAME] + node_dict[self.ROUTER][len(owner_dict[self.ROUTER]):]

            node[self.INTERFACE] = self.parse_interfaces(self.fetch_interfaces(node[self.NAME]))

        return node_list

    @topology_required
    def parse_links(self):
        link_list = []
        try:
            return map(lambda link: {
                self.SOURCE: link[self.SOURCE][self.SOURCE_NODE],
                self.TARGET: link[self.DESTINATION][self.DEST_NODE],
                self.METRIC: link[self.LINK_ATTRIBUTES][self._METRIC]
            }, self.topology[self.LINK])
        except Exception as ex:
            logger.exception("ACL parseLinks error: %s" % ex)
        return link_list

    def parse_interfaces(self, interfaces):
        unwrapped_interfaces = interfaces.get('interface-configurations', {}).get('interface-configuration', {})

        node_interfaces = []
        for interface in unwrapped_interfaces:
            node_interface = {
                'name': interface.get('interface-name'),
                'active': interface.get('active')
            }

            ipv4_network = interface.get(self.IPV4_INTERFACE)
            if ipv4_network and 'addresses' in ipv4_network:
                primary_address = interface.get(self.IPV4_INTERFACE).get('addresses').get('primary')
                if primary_address:
                    node_interface['address'] = primary_address.get('address')
                    node_interface['netmask'] = primary_address.get('netmask')

            if 'description' in interface:
                node_interface['description'] = interface.get('description')
            if self.ACL in interface:
                acls = interface[self.ACL]
                if 'inbound' in acls:
                    node_interface['inbound'] = acls['inbound'].get('name')
                if 'outbound' in acls:
                    node_interface['outbound'] = acls['outbound'].get('name')

            node_interfaces.append(node_interface)

        return node_interfaces

    def parse_acl(self, acl):
        if acl:
            parsed_acl = {
                'acl-name': acl.get('access-list-name'),
                'ace': []
            }
            for entry in acl.get('access-list-entries', {}).get('access-list-entry', {}):
                parsed_acl['ace'].append(entry)

            return parsed_acl
        else:
            return None

    def get_acls(self, node_name, interface_name, acl_parser):
        controller_acls = self.fetch_acl(node_name, default={})

        unwrapped_acls = controller_acls.get(self.ACL_DETAILS, {}).get('accesses', {}).get('access')
        interfaces = self.parse_interfaces(self.fetch_interfaces(node_name, default={}))
        interface = next((i for i in interfaces if i.get('name') == interface_name), None)

        acls = {}
        if interface:
            if 'inbound' in interface:
                acl = next((a for a in unwrapped_acls if a.get('access-list-name') == interface.get('inbound')), None)
                acls['inbound'] = self.parse_acl(acl)
            else:
                acls['inbound'] = None

            if 'outbound' in interface:
                acl = next((a for a in unwrapped_acls if a.get('access-list-name') == interface.get('outbound')), None)
                acls['outbound'] = self.parse_acl(acl)
            else:
                acls['outbound'] = None
        else:
            acls['inbound'] = None
            acls['outbound'] = None

        return acls


class AclTopologyParserNew(AbstractAclTopologyParser):

    def __init__(self):
        super(AclTopologyParserNew, self).__init__()

    @topology_required
    def _unwrap_topology(self):
        return self.topology['topology'][0] if len(self.topology.get('topology', [])) > 0 else self.topology

    @topology_required
    def get_topology_id(self):
        return self.topology.get('topology-id')

    @topology_required
    def parse_nodes(self):
        node_list = []

        for controller_node in self.topology[self.NODE]:
            node = {}
            prefix_array = []
            node_dict = html_style(controller_node[self.NODE_ID])
            attributes = controller_node[self.NODE_ATTRIBUTES]

            if self.PREFIX in attributes:
                for prefix in attributes[self.PREFIX]:
                    prefix_array.append(prefix[self.PREFIX])

            if self.ROUTER_ID in attributes:
                if self.NAME in attributes:
                    node[self.NAME] = attributes[self.NAME]
                else:
                    success, name = name_check(attributes[self.ROUTER_ID][0])
                    node[self.NAME] = name if success else node_dict[self.ROUTER]
                node[self.LOOPBACK] = attributes[self.ROUTER_ID][0]
            else:
                node[self.NAME] = node_dict[self.ROUTER]
                node[self.LOOPBACK] = "0.0.0.0"

            node[self.PREFIX] = prefix_array
            node[self.ID] = controller_node[self.NODE_ID]

            try:
                node[self.INTERFACE] = self.parse_interfaces(self.fetch_interfaces(node[self.NAME]))
                node_list.append(node)
            except HttpClientException as e:
                logger.error("Fetch interfaces for node '{}' failed.".format(node[self.NAME]))
                logger.exception(e.message)

        return node_list

    @topology_required
    def parse_links(self):
        link_list = []
        try:
            return map(lambda link: {
                self.SOURCE: link[self.SOURCE][self.SOURCE_NODE],
                self.TARGET: link[self.DESTINATION][self.DEST_NODE],
                self.METRIC: link[self.LINK_ATTRIBUTES][self.METRIC]
            }, self.topology[self.LINK])
        except Exception as ex:
            logger.exception("ACL parseLinks error: %s" % ex)
        return link_list

    def parse_interfaces(self, interfaces):
        if not interfaces:
            return {}

        unwrapped_interfaces = interfaces.get('interface-configurations', {}).get('interface-configuration', {})

        node_interfaces = []
        for interface in unwrapped_interfaces:
            node_interface = {
                'name': interface.get('interface-name'),
                'active': interface.get('active')
            }

            ipv4_network = interface.get(self.IPV4_INTERFACE)
            if ipv4_network and 'addresses' in ipv4_network:
                primary_address = interface.get(self.IPV4_INTERFACE).get('addresses').get('primary')
                if primary_address:
                    node_interface['address'] = primary_address.get('address')
                    node_interface['netmask'] = primary_address.get('netmask')

            if 'description' in interface:
                node_interface['description'] = interface.get('description')
            if self.ACL in interface:
                acls = interface[self.ACL]
                for bind in ['inbound', 'outbound']:
                    if bind in acls:
                        node_interface[bind] = acls[bind].get('acl-name-array')[0] \
                            if 'acl-name-array' in acls[bind] \
                            else acls[bind].get('name')

            node_interfaces.append(node_interface)

        return sorted(node_interfaces, key=lambda k: k['name'])

    def get_acls(self, node_name, interface_name, acl_parser):
        controller_acls = self.fetch_acl(node_name, default={})

        acls = {
            'inbound': None,
            'outbound': None
        }
        if controller_acls:
            unwrapped_acls = controller_acls.get(self.ACL_DETAILS, {}).get('accesses', {}).get('access')
            unwrapped_acls = filter(lambda a: not is_acl_name_hidden(a.get('access-list-name')), unwrapped_acls)  # remove hidden acls

            interfaces = self.parse_interfaces(self.fetch_interfaces(node_name, default={}))
            if interfaces:
                interface = next((i for i in interfaces if i.get('name') == interface_name), None)
                if interface:
                    if 'inbound' in interface:
                        acl = next((a for a in unwrapped_acls if a.get('access-list-name') == interface.get('inbound')), None)
                        acls['inbound'] = acl_parser.unparse_acl(acl)
                    if 'outbound' in interface:
                        acl = next((a for a in unwrapped_acls if a.get('access-list-name') == interface.get('outbound')), None)
                        acls['outbound'] = acl_parser.unparse_acl(acl)
        return acls


class Topology(AbstractTopology):

    def __init__(self):
        super(Topology, self).__init__()
        self.topology_parser = None

    class AclTopologyEncoder(JSONEncoder):
        def default(self, o):
            return o.__dict__

    @staticmethod
    def get_topology_encoder():
        return Topology.AclTopologyEncoder

    def get_topology_parser(self, model=None):
        parsers = {
            "standard": AclTopologyParserNew(),
            "old": AclTopologyParserOld()
        }
        return self._get_topology_parser(model, parsers)

    def parse_controller_topology(self, controller_topology):
        try:
            self.set_topology_parser(controller_topology)
        except ValidationError as e:
            logger.exception("Topology validation error: " + e.message)
            return False, controller_topology

        try:
            self.upload_topology(controller_topology)
            self.id = self.get_topology_id()
            self.nodes = self.parse_nodes()
            self.links = remove_dup_links(self.parse_links())

        except Exception as ex:
            logger.exception("ACL parse topology error: %s" % ex.message)
            return False, controller_topology

        return True, json.dumps(self, cls=self.get_topology_encoder())

    def upload_topology(self, topology):
        return self.get_topology_parser().upload_topology(topology)

    def get_topology_id(self):
        return self.get_topology_parser().get_topology_id()

    def parse_nodes(self):
        return self.get_topology_parser().parse_nodes()

    def parse_links(self):
        return self.get_topology_parser().parse_links()

    def get_acls(self, node_name, interface_name, acl_parser):
        return self.get_topology_parser().get_acls(node_name, interface_name, acl_parser)