import json
import re
from httplib import BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND

from settings import logger
from controller_operations import ControllerOperations
from backend.handlers import BaseHandler
from backend.settings import DEBUG


class Handler(BaseHandler):

    @staticmethod
    def _get_node(path):
        match = re.match("/?topo/node/(\w+)/acl/?", path)
        return None if not match else match.group(1)

    def get(self, *args, **kwargs):
        node = self._get_node(kwargs.get('path', ''))
        interface = self.get_argument("if")
        status, error_message = 200, None

        if not node or not interface:
            status = BAD_REQUEST
            error_message = "No node or interface specified"
            logger.exception(error_message)
        else:
            try:
                response = ControllerOperations().get_acls(node, interface)
                if response:
                    logger.debug(response)

                    self.set_header("Content-Type", "application/json")
                    self.write(json.dumps(response))
                    # self.finish()
                else:
                    status = NOT_FOUND
                    error_message = "No data found"
            except ValueError as e:
                status = INTERNAL_SERVER_ERROR
                error_message = e.message

        if error_message:
            logger.exception(error_message)
            if DEBUG:
                self.set_status(status, error_message)
            else:
                self.set_status(status)
        else:
            self.set_status(status)

    def post(self, *args, **kwargs):
        logger.debug('Apply acl payload: {}'.format(self.request.body))
        result, msg = ControllerOperations().apply_acls(self.request.body)
        response = {
            'ret_code': result,
            'message': msg
        }

        if result is True:
            logger.debug('Result: {}.\n Message: {}'.format('ok', msg))

            self.set_header('Content-Type', 'application/json')
            self.write(response)
        else:
            self.set_status(INTERNAL_SERVER_ERROR, json.dumps(msg))

    def delete(self, *args, **kwargs):
        logger.debug('Delete acl payload: {}'.format(self.request.body))
        result, msg = ControllerOperations().delete_acl(self.request.body)
        response = {
            'ret_code': result,
            'message': msg
        }

        if result is True:
            self.set_header('Content-Type', 'application/json')
            self.write(response)
        else:
            self.set_status(INTERNAL_SERVER_ERROR, msg)