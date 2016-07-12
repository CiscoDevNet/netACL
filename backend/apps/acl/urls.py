from backend.util.utils import url_join


class CommonUrlDispatcher(object):

    BASE_CONFIG_URL = '/restconf/config/network-topology:network-topology/topology/topology-netconf/node/{}/yang-ext:mount'
    GET_INTERFACES_URL = url_join(BASE_CONFIG_URL, '/Cisco-IOS-XR-ifmgr-cfg:interface-configurations')
    GET_ACL_URL = url_join(BASE_CONFIG_URL, '/Cisco-IOS-XR-ipv4-acl-cfg:ipv4-acl-and-prefix-list')


class StandardAclUrlDispatcher(CommonUrlDispatcher):

    POST_ACL_URL = url_join(CommonUrlDispatcher.BASE_CONFIG_URL)
    PUT_ACL_URL = url_join(POST_ACL_URL, '/Cisco-IOS-XR-ipv4-acl-cfg:ipv4-acl-and-prefix-list/accesses/access/{}')

    POST_INTERFACE_URL = url_join(CommonUrlDispatcher.GET_INTERFACES_URL, '/interface-configuration/act/{}')
    PUT_INTERFACE_URL = url_join(POST_INTERFACE_URL, '/Cisco-IOS-XR-ip-pfilter-cfg:ipv4-packet-filter/{}')
    DELETE_INTERFACE_URL = PUT_INTERFACE_URL
