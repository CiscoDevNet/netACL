from httplib import INTERNAL_SERVER_ERROR

from tornado import httpclient


class HttpClientException(Exception):

    def __init__(self, response):
        super(HttpClientException, self).__init__()

        if issubclass(response.__class__, httpclient.HTTPError):
            self.response = response.response
            self.status_code = response.code
            self.message = response.message
        elif issubclass(response.__class__, httpclient.HTTPResponse):
            self.response = response
            self.status_code = response.code
            self.message = response.body
            self.url = response.effective_url
        else:
            self.response = response
            self.status_code = INTERNAL_SERVER_ERROR
            self.message = ""
            self.url = ""

    def __repr__(self):
        return repr(self.message)