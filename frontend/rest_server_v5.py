#! /usr/bin/env python2.7
"""
    * Copyright (c) 2015 by Cisco Systems, Inc.
    * All rights reserved.

    Rest command server
    -- used for various tasks
    -- here for running the Pathman REST API

    Maintainer: Niklas Montin (niklas@cisco.com)
    20140710 - v1   basic command support, based on work by vrpolak@cisco.com
    20140716 - v2   SSL support and other http extras
    20140728 - v3   Adopted to Pathman
    20140824 - v4   Commandhandler2
    20141120 - v5   Removed need for Launcher - main section added
    """
import ConfigParser

from frontend.settings import LOGGING, base_package_dir

__author__ = 'niklas'
# Import standard Python library modules.
import os
import logging
import logging.config

# Import third party library modules.
import tornado.ioloop
import tornado.web
import tornado.httpserver
from frontend.topology import *

from frontend.handlers import WebsRestHandler

Response_Flag = True
response_list = []

# for certs
data_dir = ''


class Commands(object):
    """ ioloop to pick up REST commands. """

    def __init__(self, port=None, uri=None, backend=None, debug=False):
        """Create http server, register callbacks and start immediatelly."""

        application = tornado.web.Application([
            (r'/cisco-ctao/apps/(.*)', tornado.web.StaticFileHandler, {"path": os.path.join(base_package_dir, "client")}),
            (r'/cisco-ctao/topology(?:/(.*)|$)', DataHandler, dict(backend=backend)),
            (r'/APP/webs/(\w+)/rest/(.*)', WebsRestHandler, dict(backend=backend))
        ], dict(debug=debug))
        """
            http_server = tornado.httpserver.HTTPServer(application, ssl_options={
            "certfile": os.path.join(data_dir, "server.crt"),
            "keyfile": os.path.join(data_dir, "server.key"),
            })
            """

        application.listen(int(port))
        ioloop = tornado.ioloop.IOLoop.instance()
        logging.info('netACL REST API Launched on port %s' % port)
        ioloop.start()


if __name__ == "__main__":
    config = ConfigParser.ConfigParser()
    config.read(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'init.conf'))

    kwargs = {
        'debug': config.getboolean('common', 'debug'),
        'port': config.getint('pathman', 'port'),
        'uri': config.get('pathman', 'uri'),  # currently unused
        'backend': {
            'protocol': config.get('backend', 'protocol'),
            'host': config.get('backend', 'host'),
            'port': config.getint('backend', 'port')
        }
    }

    logging.config.dictConfig(LOGGING)
    logging.info('This is initializing the log')
    Commands(**kwargs)

# Bye bye.
