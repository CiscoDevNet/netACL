from backend.apps.acl.exceptions import AclValidationError
from settings import interfaces_path, acl_path, RESERVED_ACL_NAMES
from backend.util.utils import mkdir, TwoWayDict


def make_project_dirs():
    mkdir(interfaces_path, acl_path)


def is_acl_name_reserved(acl_name):
    """ Checks if provided name is reserved (not usable for app) for some purpose """
    return acl_name in RESERVED_ACL_NAMES


def is_acl_name_hidden(acl_name):
    """ Checks if acl with provided name should be displayed in app """
    return is_acl_name_reserved(acl_name)  # for now


def validate_acl_name(acl_name):
    """ Checks if an acl with provided name is clear for modification """
    if is_acl_name_reserved(acl_name):
        raise AclValidationError("Acl name is reserved")
    # TODO: acl name syntax checks


def get_protocol(code):
    return TwoWayDict({
        '1': 'icmp',
        '6': 'tcp',
        '17': 'udp',
        '132': 'sctp'
    }).get(code, 'ip')

