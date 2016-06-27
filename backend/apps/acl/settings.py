import os

from backend.settings import logging, logger, static_path

ACL_MODEL = 'standard'

logger = logging.getLogger('.'.join([logger.name, 'acl']))

controller_static_path = os.path.join(static_path, "controller")
interfaces_path = os.path.join(controller_static_path, "interfaces")
acl_path = os.path.join(controller_static_path, "acl")

RESERVED_ACL_NAMES = ['dont_touch']