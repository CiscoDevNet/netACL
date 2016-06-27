import json
import os
import re
import abc

import jsonschema

from backend.settings import topo_models_path, logger
from backend.util.errors import ValidationError


class AbstractTopology(object):
    __metaclass__ = abc.ABCMeta

    DEFAULT_MODEL = "standard"
    TOPOLOGY_MODEL = None

    def __init__(self):
        self.topology_parser = None

        self.id = None
        self.nodes = []
        self.links = []

    @staticmethod
    def validate_schema(file_name, topology):
        with open(os.path.join(topo_models_path, file_name)) as f:
            try:
                jsonschema.validate(topology, json.loads(f.read()))
                return True
            except jsonschema.SchemaError as e:
                logger.error("Schema '{}' is malformed. Error: {}".format(file_name, e.message))
                return False
            except ValueError as e:
                logger.error("Schema '{}' or payload is not a valid JSON. Error: {}".format(file_name, e.message))
                return False
            except jsonschema.ValidationError:
                return False

    @staticmethod
    def get_topology_model(controller_topology, default=DEFAULT_MODEL):
        models = map(lambda file_name: file_name.split(".")[0],
                     filter(lambda file_name: AbstractTopology.validate_schema(file_name, controller_topology),
                            filter(lambda f: re.match(".*\.json", f), os.listdir(topo_models_path))))

        if len(models) > 1:
            if default and default in models:
                return default
            else:
                raise ValidationError("Ambiguous models declared: " + ", ".join(models))
        if len(models) == 0:
            raise ValidationError("No models match the topology")
        return models[0]

    def _get_topology_parser(self, model, parser_dict):
        if not self.topology_parser:
            if model:
                self.topology_parser = parser_dict.get(model)
            else:
                if AbstractTopology.TOPOLOGY_MODEL:
                    self.topology_parser = parser_dict.get(AbstractTopology.TOPOLOGY_MODEL)
                else:
                    raise ValueError("No topology model initialized. Try refreshing the topology page.")

            if not self.topology_parser:
                raise ValueError("No parser defined for model '{}'".format(model))
        return self.topology_parser

    @abc.abstractmethod
    def get_topology_parser(self, model):
        return object

    def set_topology_parser(self, topology, default_model=DEFAULT_MODEL):
        model = AbstractTopology.get_topology_model(topology, default_model)
        AbstractTopology.TOPOLOGY_MODEL = model
        parser = self.get_topology_parser(model)
        if not parser:
            raise ValidationError("No parser defined for this topology")
        else:
            self.topology_parser = parser

    @staticmethod
    @abc.abstractmethod
    def get_topology_encoder():
        return None

    @abc.abstractmethod
    def upload_topology(self, topology):
        return

    @abc.abstractmethod
    def parse_nodes(self):
        return

    @abc.abstractmethod
    def parse_links(self):
        return

    @abc.abstractmethod
    def parse_controller_topology(self, controller_topology):
        return
