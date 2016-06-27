import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.options

from backend import app_connector
from backend.handlers import MainHandler, TopologyHandler, AppRoutingHandler
from backend.settings import settings, logger


class BackendApp(tornado.web.Application):

    def __init__(self, handlers, **kwargs):
        super(BackendApp, self).__init__(handlers, **kwargs)

    def set_global_vars(self, variables):
        for key, value in variables.items():
            setattr(self, key, value)


def make_app():
    return BackendApp([
        (r"/(?P<app>[^\/]+)/topology/?$", TopologyHandler),
        (r"/(?P<app>[^\/]+)/(?P<path>.*)$", AppRoutingHandler),
        (r"/(.*)$", MainHandler),
    ], **settings)

if __name__ == "__main__":
    logger.info("Starting app")

    app = make_app()
    app_connector.connect_apps(app)
    app.listen(9900)
    tornado.ioloop.IOLoop.current().start()
