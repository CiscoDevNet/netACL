import json
import urlparse

from tornado.httpclient import HTTPRequest, HTTPClient, HTTPError

from backend.settings import controller_address, controller_auth, http_client_settings, logger
from backend.util.exceptions import HttpClientException


class HttpClient(object):

    @staticmethod
    def is_ok(code):
        return 200 <= code < 400

    GET = 'GET'
    POST = 'POST'
    PUT = 'PUT'
    DELETE = 'DELETE'

    def __init__(self, dry_run=False, fail_silently=False):
        self.dry_run = dry_run or http_client_settings.get("dry_run")
        self.fail_silently = fail_silently

        logger.debug("HTTP Client initialized with config:\ndry_run={}\nfail_silently={}".format(self.dry_run, self.fail_silently))

    @staticmethod
    def set_content_type(content_type):
        if content_type == "json":
            return "application/json"
        else:
            return "text/plain"

    def send_request(self, method, url, data=None, data_type="json"):
        method = method.upper()

        has_payload = method == self.POST or method == self.PUT
        is_CUD = has_payload or method == self.DELETE

        full_url = urlparse.urlunparse((controller_address['scheme'],
                                        controller_address['host'] + ':' + str(controller_address['port']),
                                        url,
                                        None, None, None))

        headers = {
            'Content-Type': HttpClient.set_content_type(data_type)
        }
        request = HTTPRequest(url=full_url,
                              method=method,
                              headers=headers,
                              auth_username=controller_auth['username'],
                              auth_password=controller_auth['password'],
                              connect_timeout=http_client_settings.get("timeouts", {}).get("connect", 3),
                              request_timeout=http_client_settings.get("timeouts", {}).get("request", 10))

        if has_payload:
            if data_type == "json":
                request.body = json.dumps(data)

        if is_CUD:
            if self.dry_run:
                logger.info("\nDRY RUN")
            logger.debug("\n\nSending {} request.\nUrl: {}\nBody: {}\n".format(method, full_url, request.body))

        if is_CUD and self.dry_run:
            response = json.dumps({
                "status": "ok",
                "msg": "dry_run"
            })
        else:
            try:
                response = HTTPClient().fetch(request)
                if not self.fail_silently and not self.is_ok(response.code):
                    raise HttpClientException(response)

                logger.debug("\n\nResponse ({}).\nUrl: {}\nBody: {}\n".format(response.code, full_url, response.body))

                return response
            except HTTPError as e:
                logger.debug("HttpClient error: {}".format(e.message))
                if not self.fail_silently:
                    raise HttpClientException(e)
                return None
        return response

    def get(self, url):
        return self.send_request(self.GET, url)

    def post(self, url, data):
        return self.send_request(self.POST, url, data)

    def put(self, url, data):
        return self.send_request(self.PUT, url, data)

    def delete(self, url):
        return self.send_request(self.DELETE, url)
