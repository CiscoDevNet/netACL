

class AclValidationError(ValueError):

    def __init__(self, message):
        super(AclValidationError, self).__init__()
        self.message = message
