from backend.settings import IS_NEW_CONTROLLER
from backend.util.utils import url_join

if IS_NEW_CONTROLLER:
    base_config_url = '/restconf/config/network-topology:network-topology/topology/topology-netconf/node/{}/yang-ext:mount'
else:
    base_config_url = '/restconf/config/opendaylight-inventory:nodes/node/{}/yang-ext:mount'

interfaces_url = url_join(base_config_url, '/Cisco-IOS-XR-ifmgr-cfg:interface-configurations')
acl_url = url_join(base_config_url, '/Cisco-IOS-XR-ipv4-acl-cfg:ipv4-acl-and-prefix-list')
