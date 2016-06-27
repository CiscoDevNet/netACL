"""
    parseNodes Updated 20150726 by Niklas for OSPF support and ISIS/OSPF broadcast network/pseudo node support
    changed prints to logging, Niklas 20151005
    """
import tornado.web
import tornado.httpclient

from tornado import gen
from tornado.httpclient import HTTPError

from frontend.utils import url_join
import urlparse



class DataHandler(tornado.web.RequestHandler):

    def initialize(self, backend):
        self.backend = urlparse.urlunparse((backend["protocol"], backend["host"] + ":" + str(backend["port"]), '', '', '', ''))
        print(self.backend)

    @gen.coroutine
    def get(self, app):
        url = url_join(self.backend, str(app).lower(), 'topology')

        http_client = tornado.httpclient.AsyncHTTPClient()

        try:
            response = yield http_client.fetch(url)
        except HTTPError as e:
            self.set_status(e.code, e.message)
        else:
            self.set_header("Content-Type", "application/json")
            self.write(response.body)
        finally:
            self.finish()