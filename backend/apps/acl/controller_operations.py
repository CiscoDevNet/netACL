import json

from acl_parser import AclParserStandard, AclOps
from topology_parser import Topology
from settings import ACL_MODEL, logger
from backend.util.errors import ValidationError


class ControllerOperations(object):

    @staticmethod
    def _get_acl_parser(model, operation):
        return {
            'standard': AclParserStandard(operation)
        }.get(model)

    def __init__(self):
        super(ControllerOperations, self).__init__()
        self.acl_parser = None

    def get_acl_parser(self, model=ACL_MODEL, operation=None):
        if not self.acl_parser:
            parser = ControllerOperations._get_acl_parser(model, operation)
            if not parser:
                error_message = "No parser defined for this acl model"
                logger.exception(error_message)
                raise ValidationError(error_message)
            else:
                self.acl_parser = parser
        return self.acl_parser

    def get_acls(self, node_name, interface_name):
        try:
            acl_parser = ControllerOperations._get_acl_parser(ACL_MODEL, AclOps.GET)  # TODO: add support for other models (how?)
            return Topology().get_acls(node_name, interface_name, acl_parser)
        except Exception as e:
            logger.exception(e.message)
            return False, e.message

    def apply_acls(self, payload_string):
        try:
            payload = json.loads(payload_string)
            self.get_acl_parser(operation=AclOps.APPLY).upload_payload(payload)
            try:
                self.get_acl_parser().apply_acls()
            except Exception as e:
                error = e.response.body if hasattr(e, 'response') else e.message
                logger.exception(error)
                return False, error

            return True, 'ok'
        except Exception as e:
            logger.exception(e.message)
            return False, e.message

    def delete_acl(self, payload_string):
        try:
            payload = json.loads(payload_string)
            self.get_acl_parser(operation=AclOps.DELETE).upload_payload(payload)
            try:
                self.get_acl_parser().delete_acl()
            except Exception as e:
                logger.exception(e.message)
                return False, json.loads(e.response.body) if hasattr(e, 'response') else e.message

            return True, 'ok'
        except Exception as e:
            logger.exception(e.message)
            return False, e.message
