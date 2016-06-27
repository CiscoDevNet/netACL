# netACL
## Getting started

Run pathman:
1. Run ```pip install -r pathman/requirements.txt``` in your python environment
2. Run ```python -m pathman.rest_server_v5```

Run backend:
1. Run ```pip install -r backend/requirements.txt``` in your python environment
2. Create "backend/local_settings.py" with corresponding to "backend/settings.py" variables
3. Make sure current user has enough permissions to create system path specified in "log_file" variable
4. Run ```python -m backend.app```

How to connect apps to backend:
1. Create a python package with name equal to app name
2. Create following python modules in app package with specific contents (list is to be altered):
2.1. "topology_parser.py"
2.1.1. Class "Topology" with "parse_controller_topology" method that handles parsing topology from controller format to UI usable one
2.2. "handler.py"
2.2.1. Class "Handler" that subclasses "tornado.web.RequestHandler" class. It should provide HTTP verb methods (at least "get", "post", "put" and "delete") and behave like a tornado handler
3. Add app name to "INSTALLED_APPS" list in "backend/local_settings.py" file
4. Run backend and check logs to see if app connection has been successful