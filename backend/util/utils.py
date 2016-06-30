import os
from itertools import groupby


class TwoWayDict(object):

    sentinel = object()

    def __init__(self, items=None):
        self.items = {}
        if items:
            for k, v in items.items():
                self[k] = v

    def __setitem__(self, key, value):
        self.pop(key, None)
        self.items.__setitem__(key, value)
        self.items.__setitem__(value, key)

    def __getitem__(self, key):
        return self.items.__getitem__(key)

    def __repr__(self):
        return dict(filter(lambda a: repr(a[0]) < repr(a[1]), self.items.items())).__repr__()

    def __delitem__(self, key):
        self.items.__delitem__(self.items.__getitem__(key))
        self.items.__delitem__(key)

    def get(self, key, default=None):
        return self.items.get(key, default)

    def pop(self, key, default=sentinel):
        if default is self.sentinel:
            if key in self.items:
                self.items.pop(self.items.get(key))
            return self.items.pop(key)
        else:
            self.items.pop(self.items.get(key), default)
            return self.items.pop(key, default)


def get_protocol(code):
    return TwoWayDict({
        '1': 'icmp',
        '6': 'tcp',
        '17': 'udp',
        '132': 'sctp'
    }).get(code, 'ip')


def mkdir(*dirs):
    for d in dirs:
        if not os.path.exists(d):
            os.makedirs(d)


def touch(fname, times=None):
    with open(fname, 'a'):
        os.utime(fname, times)


def mkfile(path):
    mkdir(os.path.dirname(path))
    touch(path)


def url_join(*parts):
    if len(parts) > 0:
        return ('/' if parts[0].startswith('/') else '') \
               + '/'.join(s.strip('/') for s in parts) \
               + ('/' if parts[-1].endswith('/') else '')
    return None


def name_check(address):
    # check if a name is mapped to address
    import socket
    try:
        name = socket.gethostbyaddr(address)[0]
        return True, name
    except:
        return False, ""


def locations_of_substring(string, target, offset=0):
    # recursive counter of all occurances
    temp = []
    start = string.find(target)

    if start != -1:
        temp = [start + offset]
        temp += locations_of_substring(string[start + len(target):], target, offset + start + len(target))
    return temp


def html_style(string):
    # find arguments and build list of dicts

    first = locations_of_substring(string, '/')
    start = locations_of_substring(string, '&')
    end = locations_of_substring(string, '=')
    start.insert(0, first[-1])

    return chop_chop(start, end, string)


def chop_chop(start, end, string):
    # Build value pair dict from restconf response

    mydict = {}
    while len(start) > 0:

        arg = string[start[0] + 1:end[0]]
        if len(start) > 1:
            inext = start[1]
        else:
            inext = len(string)
        value = string[end[0] + 1:inext]

        mydict.update({arg: value})
        start.pop(0)
        end.pop(0)

    return mydict


# check performance on larger data
def remove_dup_links(links):
    link_list = []
    sorted_links = sorted(links, key=lambda k: sorted([k['source'], k['target']]))

    for key, group in groupby(sorted_links, lambda k: sorted([k['source'], k['target']])):
        sorted_group = sorted(group, key=lambda k: k['source'])

        link = {
            'source': key[0],
            'target': key[1],
            'sourceTraffic': sorted_group[0]['metric']
        }
        if len(sorted_group) == 2:
            link['targetTraffic'] = sorted_group[1]['metric']

        link_list.append(link)

    return link_list


# old code
def dup_link(links):
    link_list = []
    for i in range(len(links) - 1):
        temp = {}
        for j in range(i + 1, len(links)):
            if links[i]['source'] == links[j]['target'] and links[i]['target'] == links[j]['source']:
                temp["source"] = links[i]['source']
                temp["target"] = links[i]['target']
                temp["sourceTraffic"] = links[i]['metric']
                temp["targetTraffic"] = links[j]['metric']
                link_list.append(temp)
    return link_list


def get_directory_name(f):
    return os.path.split(os.path.dirname(os.path.realpath(f)))[1]
