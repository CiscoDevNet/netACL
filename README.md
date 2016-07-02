# netACL

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
2. Go to ACL app index page, which can be located at: ```%YOUR_HOST%/cisco-ctao/apps/acl/index.html```, where ```%YOUR_HOST``` should be substituted by host name of where **frontend** is deployed. You should see the main app screen:
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

