from httplib import INTERNAL_SERVER_ERROR

import urlparse

from tornado.httpclient import HTTPClient, HTTPRequest, HTTPError
from tornado.web import RequestHandler

from utils import url_join, query_join


def initialize(self, backend):
    self.backend = urlparse.urlunparse((backend["protocol"], backend["host"] + ":" + str(backend["port"]), '', '', '', ''))


class WebsRestHandler(RequestHandler):

    def initialize(self, backend):
        self.backend = urlparse.urlunparse((backend["protocol"], backend["host"] + ":" + str(backend["port"]), '', '', '', ''))

    def get(self, app, url):
        backend_url = url_join(self.backend, app, url, query_join(self.request.arguments))

        try:
            response = HTTPClient().fetch(HTTPRequest(url=backend_url,
                                                      method='GET'))
            self.set_header("Content-Type", "application/json")
            self.write(response.body)
        except HTTPError as e:
            self.set_status(e.code)
            self.write(e.message)

    def post(self, app, url):
        backend_url = url_join(self.backend, app, url)

        try:
            response = HTTPClient().fetch(HTTPRequest(url=backend_url,
                                                      method='POST',
                                                      body=self.request.body))

            self.set_header("Content-Type", "application/json")
            self.write(response.body)
        except HTTPError as e:
            self.set_status(e.code)
            self.write(e.message)

    def delete(self, app, url):
        backend_url = url_join(self.backend, app, url)

        try:
            response = HTTPClient().fetch(HTTPRequest(url=backend_url,
                                                      method='DELETE',
                                                      body=self.request.body,
                                                      allow_nonstandard_methods=True))  # TODO: reformat maybe?

            self.set_header("Content-Type", "application/json")
            self.write(response.body)
        except HTTPError as e:
            self.set_status(e.code)
            self.write(e.message)
        except Exception as e:
            self.set_status(INTERNAL_SERVER_ERROR)
            self.write(e.message)
