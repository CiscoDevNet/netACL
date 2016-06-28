import logging
import os

import time

log_file = 'frontend.log'
log_size = 100000
log_count = 3
log_level = 'INFO'

debug_modules = ['node_structure']

base_package_name = os.path.dirname(__file__)

class DebugFilter(logging.Filter):
    ''' limits debug output to selected modules '''
    def filter(self, record):
        if record.levelname != 'DEBUG':
            return True
        else:
            return record.funcName in debug_modules


class MyFormatter(logging.Formatter):
    ''' Gives us a dot instead of a comma in the log printout '''
    converter = time.gmtime

    def formatTime(self, record, datefmt=None):
        ct = self.converter(record.created)
        if datefmt:
            s = time.strftime(datefmt, ct)
        else:
            t = time.strftime("%Y-%m-%d %H:%M:%S", ct)
            s = "%s.%03d" % (t, record.msecs)
        return s


LOGGING = {
    'version': 1,
    'filters': {
        'module_filter': {
            '()': DebugFilter
            }
        },
    'formatters': {
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
                },
        'to_screen': {
            'format': '[%(levelname)s] %(funcName)s: %(message)s'
            },
        'to_file':{
            '()':MyFormatter,
            'format' : '%(process)d %(asctime)12s UTC %(name)s:%(funcName)-12s %(levelname)s: %(message)s'
            }
        },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'filters': ['module_filter'],
            'formatter':'to_screen'
            },
        'logtofile':{
            'class': 'logging.handlers.RotatingFileHandler',
            'filters': ['module_filter'],
            'formatter':'to_file',
            'filename': log_file,
            'maxBytes': log_size,
            'backupCount': log_count,
            'encoding': 'utf8'
            }
        },
    'root': {
        'level': log_level,
        #'handlers': ['console','logtofile']
        'handlers': ['logtofile']
        },
}
