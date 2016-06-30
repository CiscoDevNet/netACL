import os
import logging
import logging.config

from backend.util import utils

try:
    from backend.local_settings import *
except ImportError:

    # Common settings

    DEBUG = False

    INSTALLED_APPS = [
        'acl',
    ]

    # Static paths

    static_path = os.path.join(os.path.dirname(__file__), "static")
    models_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
    topo_models_path = os.path.join(models_path, "topology")
    controller_static_path = os.path.join(static_path, "controller")
    interfaces_path = os.path.join(controller_static_path, "interfaces")

    # Logging

    log_file = '/var/log/netACL/app.log'
    utils.mkfile(log_file)

    logging.config.dictConfig(
        {
            'version': 1,
            'formatters': {
                'default': {
                    'format': '%(asctime)s\t-%(name)s-\t[%(levelname)s]\nPath: %(pathname)s\nMessage: %(message)s',
                    'datefmt': '%Y-%m-%d %H:%M:%S'
                }
            },
            'handlers': {
                'file': {
                    'level': 'WARN',
                    'class': 'logging.handlers.RotatingFileHandler',
                    'formatter': 'default',
                    'filename': log_file
                }
            },
            'loggers': {
                'netACL': {
                    'level': 'WARN',
                    'handlers': ['file'],
                    'qualname': 'netACL'
                }
            },
            'disable_existing_loggers': False
        }
    )
    logger = logging.getLogger('netACL')

    # App-specific settings

    USE_STATIC_DATA = False
    PERSIST_TO_STATIC_FILES = False

    # Controller

    controller_address = {
        'scheme': 'http',
        'host': '198.18.1.80',
        'port': 8181
    }

    controller_auth = {
        'username': 'admin',
        'password': 'admin'
    }

    # Utils

    http_client_settings = {
        "timeouts": {
            "connect": 7,
            "request": 10
        },
        "dry_run": False,
        "debug": DEBUG
    }

    logger.warning("No local settings found, using default settings")


# Tornado

base_package_name = utils.get_directory_name(__file__)

settings = {
    "debug": DEBUG,
    "static_path": static_path,
}
