import json
import os

from backend.settings import USE_STATIC_DATA, PERSIST_TO_STATIC_FILES
from backend.util.http_client import HttpClient


def fetch_and_persist(url, file_name, default=None):
    if USE_STATIC_DATA is True:
        if os.path.exists(file_name):
            with open(file_name) as f:
                return json.loads(f.read())
        else:
            return default
    else:
        response = HttpClient().get(url)
        if PERSIST_TO_STATIC_FILES:
            with open(file_name, 'w') as f:
                f.write(response.body)
        return json.loads(response.body)