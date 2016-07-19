
# OpenDaylight netACL App

OpenDaylight (ODL) is an open-source application development and delivery platform. Access Control Lists (ACL) are configuration statements deployed on routers intended to permit or deny traffic. They are typically used to filter traffic for security or administrative reasons. NetACL is an application developed on top of ODL enabling the user to program ACLs on routers. 

## Team:

- Ilia Abashin
- Niklas Montin
- Alex Zverev
- Chris Metz
- Stacy Ling
- Bob Shi
- Giles Heron


### Project demo Link:

[https://github.com/CiscoDevNet/netACL](https://github.com/CiscoDevNet/netACL)

### Contact Email:

<netacl-app@external.cisco.com>

### Social Tags:

SDN, Open Source, NexT, IP, MPLS, BGP, BGP-LS, ACL, ACE, RESTCONF API, YANG

### Project Kick-off Date:

February 2016

### Current Status:

Beta

### Application Overview

ACLs are a fundamental portion for the configuration of routers in enterprise and SP networks. ACLs (composed of multiple access control elements (ACE)) are applied on a per-router/per-interface basis. Operators are faced with the daunting task of ACL management and deployment given a large number of routers in a network.The work involved is O(# of routers * # of interfaces per router)

In most (if not all) cases, operators will resort to customized scripts. These require constant maintenance and worse, must support multi-vendor networks. An application that "abstracts away" the specifics of ACL configuration but makes it easier automate deployment is required. With a nice GUI. And multi-vendor support. On open source. All good.

netACL addresses all of the requirements. netACL visualizes a router network. The operator to easily define, then point/click for deployment. It runs on top of ODL and uses netconf to exchange ACL configuration information with the router(s).

The architecture netACL is depicted here.

![](demo/pathman-SR-arch.png)
Figure 1. Pathman-SR Architecture

The Pathman-SR architecture is similar to the Pathman architecture. It uses BGP-LS to collect and render the network. It uses PCEP to program SR segment stacks on the ingress router which define the path of segments packets should traverse (aka SR-path) 

A little color is added below on some of the components of the app itself. This might help those who are reviewing the code to better understand some of the pieces. 

The front-end of the app uses:
- NeXt is the UI framework used to render topologies and graphs. This is open source and a [formal ODL project](https://wiki.opendaylight.org/view/NeXt:Main).
- [AngularJS](https://angularjs.org/) is a popular UI framework based on the model-view-controller (MVC) paradigm. This enables efficient/modularized development/testing of the code.
 
The back-end of the app employs a number of Python modules that among other things compute SR-path candidates and execute RESTCONF API calls directly to ODL. The combination of the Pathman-SR application front-end and back-end provide an excellent example of a working ODL application.

A final note: some or all of the routers must support segmenting routing (software configuration knob). In this example all routers have SR turned on (denoted by a small "SR" icon). In actual deployments a subset of the routers would have SR turned. 

### Pathman-SR Examples

The following are example screenshots from Pathman-SR illustating the look/feel of specific functions. The nodes shown in the topology display a "PC" icon meaning it supports PCEP which is the protocol running between the router or ODL carrying SR-path segment stacks. This means the router can be an ingress or head-end for an SR-path. The "SR" indicates it supports segmenting routing an ingress, egress or intermediate router. Just to avoid any confusion Pathman-SR only supports SR-path management.


![](demo/setup-path-panel.png)
Figure 2. Search for an optimal path

In this example an SR-path between atl and chi has been requested. This panel shows the SR-paths computed. The path selected on the right is highlighted in the topology on the left. 

![](demo/path-deployed-message.png)
Figure 3. Path has been deployed

This shows the selected path that was in turn deployed (programmed) into the network.

![](demo/deployed-path-list.png)
Figure 4. List of all deployed paths

This panel shows the list of deployed (active) SR-paths on the right and the selected one is highlighted in the topology.

![](demo/node-details.png)
Figure 5. Random node info. Link and/or path details are also available in one-two-click

And finally the panel provides information on specific nodes.

## Getting started

### Run frontend:
1. Run ```pip install -r frontend/requirements.txt``` in your python environment
2. Run ```python -m frontend.rest_server_v5```

### Run backend:
1. Run ```pip install -r backend/requirements.txt``` in your python environment
2. Create "backend/local_settings.py" with corresponding to "backend/settings.py" variables.
  1. ```controller_address``` and ```controller_auth``` variables should be set to establish connection to a working ODL instance with a running network topology. *(TBD - supported controller versions)* 
3. Make sure current user has enough permissions to create system path specified in "log_file" variable
4. Run ```python -m backend.app```

## Running ACL app
After deploying [frontend](#run-frontend) and [backend](#run-backend):

1. Open your browser. *(TBD - supported browsers)*
2. Go to ACL app index page, which can be located at: ```%YOUR_HOST%:%YOUR_PORT%/cisco-ctao/apps/acl/index.html```, where ```%YOUR_HOST%``` and ```%YOUR_PORT%``` should be substituted by host name and port number respectively of where **frontend** is deployed. You should see the main app screen:
![Main screen](https://github.com/CiscoDevNet/netACL/blob/master/images/main_view.png)
3. Enter an existing node name in the search field in the upper left corner of the page. You'll see a list of existing network interfaces on this node.
![Interface list screen](https://github.com/CiscoDevNet/netACL/blob/master/images/node_selected.png)
4. Select an interface and click *add to selection list*, then click *Add ACL*.
![ACL choice screen](https://github.com/CiscoDevNet/netACL/blob/master/images/acl_choice.png)
5. Choose *New from blank ACL* or *New from template*. Here is an example of a preset template:
![Infrastructure template](https://github.com/CiscoDevNet/netACL/blob/master/images/infrastructure_template.png)
6. Click *Deploy Inbound* or *Deploy Outbound*, enter a name and hit *Confirm*. Click *Back to full map view*, then the chevron near selected ACLs and subsequently *View ACL*. You'll see the ACL applied to your selected interface.
![Interface ACLs](https://github.com/CiscoDevNet/netACL/blob/master/images/interface_acls.png)
7. The ACL is now applied to the interface.

## Adding apps
1. Create a python package with name equal to app name
2. Create following python modules in app package with specific contents (list is to be altered):
  1. ```topology_parser.py```:
    1. Class ```Topology``` with ```parse_controller_topology``` method that handles parsing topology from controller format to UI usable one
  2. ```handler.py```:
    1. Class ```Handler``` that subclasses ```tornado.web.RequestHandler``` class. It should provide HTTP verb methods (at least *get*, *post*, *put* and *delete*) and behave like a tornado handler
3. Add app name to ```INSTALLED_APPS``` list in ```backend/local_settings.py``` file
4. Run backend and check logs to see if app connection has been successful

