import json
import os
from httplib import NOT_FOUND, INTERNAL_SERVER_ERROR, FORBIDDEN

import tornado.web

from backend import app_connector
from backend.settings import DEBUG, controller_static_path, USE_STATIC_DATA, logger
from backend.util.http_client import HttpClient
from backend.util.urls import topology_url


class BaseHandler(tornado.web.RequestHandler):
    def data_received(self, chunk):
        pass


class MainHandler(BaseHandler):
    def get(self, path):
        self.set_status(NOT_FOUND)
        self.set_header("Content-Type", "text/plain")
        self.write("Not found lol.\nPath: " + path)

    def post(self, path):
        self.set_status(NOT_FOUND)
        self.set_header("Content-Type", "text/plain")
        self.write("Didn't read lol.\nPath: " + path)


class TopologyHandler(BaseHandler):

    @staticmethod
    def fetch_topology():
        if USE_STATIC_DATA is True:
            file_name = os.path.join(controller_static_path, "topo.json")
            if os.path.exists(file_name):
                with open(file_name) as f:
                    return json.loads(f.read())
            else:
                return None
        else:
            return json.loads(HttpClient().get(topology_url).body)

    @staticmethod
    def get_topology(topology_parser):
        controller_topology = TopologyHandler.fetch_topology()
        if controller_topology:
            return topology_parser.parse_controller_topology(controller_topology)

    def get(self, app):
        if app_connector.is_app_connected(self.application, app) is False:
            error_message = "App '{}' is not installed".format(app)
            logger.error(error_message)
            self.set_status(FORBIDDEN, error_message)
            self.finish()
        else:
            topology_parser = app_connector.get_topology_parser(self.application, app)()

            try:
                parsed_topology = TopologyHandler.get_topology(topology_parser)
            except Exception as e:
                logger.error("Topology fetch failed. Error: {}".format(e.message))
                if DEBUG:
                    self.set_status(INTERNAL_SERVER_ERROR, e.message)
                else:
                    self.set_status(INTERNAL_SERVER_ERROR)
                self.finish()
            else:
                if DEBUG:
                    logger.debug("Parsed topology: {}".format(parsed_topology))

                self.set_header("Content-Type", "application/json")
                self.write(parsed_topology)


class WebsHandler(BaseHandler):
    def get(self, path):
        print(path)
        self.write("Handler: " + self.__class__.__name__)
        self.write("\nPath: " + path)


class AppRoutingHandler(BaseHandler):

    def prepare(self, **kwargs):
        super(AppRoutingHandler, self).prepare()
        self.app_name = self.path_kwargs.get('app')
        self.handler = app_connector.get_handler(self.application, self.app_name)(self.application, self.request, **kwargs)

    def __init__(self, application, request, **kwargs):
        super(AppRoutingHandler, self).__init__(application, request, **kwargs)
        self.app_name = None
        self.handler = None

    def get(self, *args, **kwargs):
        self.handler.get(*args, **kwargs)
        self.finalize()

    def post(self, *args, **kwargs):
        self.handler.post(*args, **kwargs)
        self.finalize()

    def put(self, *args, **kwargs):
        self.handler.put(*args, **kwargs)
        self.finalize()

    def delete(self, *args, **kwargs):
        self.handler.delete(*args, **kwargs)
        self.finalize()

    def finalize(self):
        if self.handler.get_status() != 200:
            self.set_status(self.handler.get_status(), self.handler._reason)
        else:
            for chunk in self.handler._write_buffer:
                self.write(chunk)
