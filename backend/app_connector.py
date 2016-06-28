import importlib

from backend.settings import INSTALLED_APPS, logger, base_package_name


def format_app_name(app_name):
    return app_name.lower()


def connect_apps(main_app):
    apps = {}
    for app_name in list(map(format_app_name, INSTALLED_APPS)):
        try:
            importlib.import_module('.'.join([base_package_name, 'apps', app_name]))  # init app
            topology_module = importlib.import_module('.'.join([base_package_name, 'apps', app_name, 'topology_parser']))
            handler_module = importlib.import_module('.'.join([base_package_name, 'apps', app_name, 'handler']))
        except ImportError as e:
            error = "Failed connecting app {}. Reason: {}".format(app_name, e.message)
            logger.error(error)
        else:
            app = {
                'topology_parser': topology_module.Topology,
                'handler': handler_module.Handler
            }

            apps[app_name] = app
            logger.info("Connected app: {}".format(app_name))

    main_app.set_global_vars({'connected_apps': apps})


##########################


def _get_connected_apps(main_app):
    return getattr(main_app, 'connected_apps', {})


def _get_connected_app(main_app, app_name):
    return _get_connected_apps(main_app).get(format_app_name(app_name), {})


##########################


def is_app_connected(main_app, app_name):
    return format_app_name(app_name) in _get_connected_apps(main_app)


def get_topology_parser(main_app, app_name):
    return _get_connected_app(main_app, app_name).get('topology_parser')


def get_handler(main_app, app_name):
    return _get_connected_app(main_app, app_name).get('handler')

