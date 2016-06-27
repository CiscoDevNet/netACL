import abc
from json import JSONEncoder

from backend.settings import logger
from backend.util.topology_parser import AbstractTopology, ValidationError
from backend.util.utils import remove_dup_links, html_style, name_check


class AbstractBgpTopologyParser(object):

    __metaclass__ = abc.ABCMeta

    def __init__(self):
        self.topology = None

    def upload_topology(self, topology):
        self.topology = self._unwrap_topology(topology)

    @abc.abstractmethod
    def _unwrap_topology(self):
        """ Remove higher unused levels of topology """
        return self.topology

    @abc.abstractmethod
    def get_topology_id(self):
        """ Get id or name of topology """
        return

    @abc.abstractmethod
    def parse_nodes(self):
        """ Retrieve and parse all nodes from topology """
        return

    @abc.abstractmethod
    def parse_links(self):
        """ Retrieve and parse all links from topology """
        return


class BgpTopologyParserOld(AbstractBgpTopologyParser):

    def parse_links(self):
        return

    def get_topology_id(self):
        return

    def parse_nodes(self):
        return

    def _unwrap_topology(self):
        return

    def __init__(self):
        super(BgpTopologyParserOld, self).__init__()


class BgpTopologyParserNew(AbstractBgpTopologyParser):

    def __init__(self):
        super(BgpTopologyParserNew, self).__init__()

    def _unwrap_topology(self):
        return self.topology['topology'][0] if len(self.topology.get('topology', [])) > 0 else self.topology

    def get_topology_id(self):
        return self.topology.get('topology-id')

    def parse_links(self):
        logger.debug("BGP compose links")
        link_list = []
        try:
            return map(lambda link: {
                'source': link['source']['source-node'],
                'target': link['destination']['dest-node'],
                'metric': link['l3-unicast-igp-topology:igp-link-attributes']['metric']
            }, self.topology['link'])
        except Exception as ex:
            logger.exception("BGP get node error3: {}".format(ex.message))
        return link_list

    def parse_nodes(self):

        logger.debug("BGP build node topology")
        node_list = []
        try:
            for nodes in self.topology['node']:
                node = {}
                prefix_array = []
                node_dict = html_style(nodes['node-id'])
                if 'prefix' in nodes['l3-unicast-igp-topology:igp-node-attributes'].keys():
                    for prefix in nodes['l3-unicast-igp-topology:igp-node-attributes']['prefix']:
                        prefix_array.append(prefix['prefix'])
                if 'router-id' in nodes['l3-unicast-igp-topology:igp-node-attributes'].keys():
                    if 'name' in nodes['l3-unicast-igp-topology:igp-node-attributes'].keys():
                        node['name'] = nodes['l3-unicast-igp-topology:igp-node-attributes']['name']
                    else:
                        success, name = name_check(nodes['l3-unicast-igp-topology:igp-node-attributes']['router-id'][0])
                        if success:
                            node['name'] = name
                        else:
                            node['name'] = node_dict['router']
                    node['loopback'] = nodes['l3-unicast-igp-topology:igp-node-attributes']['router-id'][0]
                else:
                    node['name'] = node_dict['router']
                    node['loopback'] = "0.0.0.0"
                node['prefix'] = prefix_array
                node['id'] = nodes['node-id']
                node_list.append(node)
            for node in node_list:
                node_dict = html_style(node['id'])
                if node['name'] == node_dict['router'] and node['loopback'] == "0.0.0.0":
                    for owner in node_list:
                        owner_dict = html_style(owner['id'])
                        if node['name'][:len(owner_dict['router'])] == owner_dict['router'] and node['name'] != owner['name']:
                            node['name'] = owner['name']+node_dict['router'][len(owner_dict['router']):]
        except Exception as ex:
            logger.exception("BGP get node error2: {}".format(ex.message))
        logger.debug("BGP Nodelist Len: %s" %len(node_list))
        return node_list


class Topology(AbstractTopology):

    def __init__(self):
        super(Topology, self).__init__()
        self.topology_parser = None

    class BgpTopologyEncoder(JSONEncoder):
        def default(self, o):
            return o.__dict__

    @staticmethod
    def get_topology_encoder():
        return Topology.BgpTopologyEncoder

    def get_topology_parser(self, model=None):
        parsers = {
            "standard": BgpTopologyParserNew(),
            "old": BgpTopologyParserOld()
        }
        return self._get_topology_parser(model, parsers)

    def upload_topology(self, topology):
        return self.get_topology_parser().upload_topology(topology)

    def parse_nodes(self):
        return self.get_topology_parser().parse_nodes()

    def parse_links(self):
        return self.get_topology_parser().parse_links()

    def get_topology_id(self):
        return self.get_topology_parser().get_topology_id()

    def parse_controller_topology(self, controller_topology):
        try:
            self.set_topology_parser(controller_topology)
        except ValidationError as e:
            logger.exception("Topology validation error: {}".format(e.message))
            return

        try:
            self.upload_topology(controller_topology)
            self.id = self.get_topology_id()
            self.nodes = self.parse_nodes()
            self.links = remove_dup_links(self.parse_links())

        except Exception as ex:
            logger.exception("BGP get node error: {}".format(ex.message))
