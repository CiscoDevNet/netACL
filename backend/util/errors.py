

class ValidationError(Exception):
    def __init__(self, message):
        super(ValidationError, self).__init__(message)
