import re


class AclValidator(object):

    ALLOWED_VALUES = {
        "grant": ["permit", "deny"],
        "operator": ["equal", "not-equal", "range", "less-than", "greater-than"],
        "ip": [r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", "any"]
    }

    def __init__(self):
        self._errors = {}

    def validate_entry(self, entry):
        if "sequence-number" not in entry or not str(entry["sequence-number"]).isdigit():
            self._errors.update({"sequence-number": "Sequence number is missing or not a number"})

        if "grant" not in entry or entry["grant"] not in self.ALLOWED_VALUES.get("grant", []):
            self._errors.update({"grant": "Grant is missing or invalid"})

    def validate_ip(self, field_name, ip):
        for regex in self.ALLOWED_VALUES["ip"]:
            if re.match(regex, ip):
                return
        self._errors.update({field_name: "{} has invalid value".format(field_name)})

    def validate_operator(self, field_name, operator):
        if operator not in self.ALLOWED_VALUES["operator"]:
            self._errors.update({field_name: "{} has invalid value".format(field_name)})

    def is_valid(self):
        return self._errors == {}

    def get_errors(self):
        return self._errors
