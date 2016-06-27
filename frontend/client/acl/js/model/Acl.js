(function (nx) {
    var deepClone = nx.deepClone = function (target) {
        if (target) {
            if (target.__clone__) {
                return target.__clone__();
            }
            else {
                if (nx.is(target, 'Array')) {
                    var arr = [];
                    nx.each(target, function (item) {
                        arr.push(deepClone(item));
                    });
                    return arr;
                }
                else {
                    var result = {};
                    for (var key in target) {
                        if (target.hasOwnProperty(key)) {
                            var obj = target[key];
                            if (nx.is(obj, "Object")) {
                                obj = deepClone(obj);
                            }
                            result[key] = obj;
                        }
                    }

                    return result;
                }
            }
        }
        else {
            return target;
        }
    }


    var toJson = nx.toJson = function (obj) {
        var jsonObj = null;
        if (!nx.is(obj, nx.Object) && !nx.is(obj, 'Array')) {
            return nx.is(obj, 'Object') ? deepClone(obj) : obj;
        } else if (nx.is(obj, 'Array') || nx.is(obj, nx.data.Collection)) {
            jsonObj = [];
            obj.each(function (item) {
                jsonObj.push(toJson(item));
            });
        } else {
            jsonObj = {};
            var props = obj._data;
            nx.each(props, function (value, prop) {
                jsonObj[prop] = toJson(obj.get(prop));
            });
        }

        return jsonObj;
    }

    var isEmptyObj = function (a) {
        for (var b in a)return false;
        return true;
    }

    var getIpStr = function (type) {
        var ipStr = 'any';
        var netData = this._data[type + '-network'];
        if (!isEmptyObj(netData._data)) {
            var address = netData.get('address');
            if (address) {
                ipStr = address;
            }
            var wcb = netData.get('wild-card-bits');
            if (wcb)ipStr += "&nbsp;&nbsp;" + wcb;
        }

        var portData = this._data[type + '-port'];
        if (!isEmptyObj(portData._data)) {
            var firstPort = portData.get('first-port');
            var secondPort = portData.get('second-port');
            var operator = portData.get('port-mode');
            if (firstPort || secondPort) {
                ipStr += ' ' + operator + ' ' + firstPort;
                if (secondPort && operator == 'range') ipStr += ' ' + secondPort;
            }
        }


        return ipStr;
    }

    nx.define('odl.acl.model.Acl', nx.data.ObservableObject, {
        properties: {
        },
        methods: {
            init: function (data, initBound) {
                this.inherited(data);
                var self = this;
                if (initBound === true) {
                    nx.each(['inbound', 'outbound'], function (boundName) {
                        var bound = self._data[boundName];
                        if (bound) {
                            self._initBound.call(self, boundName, bound);
                        }
                    });
                }
            },
            _initBound: function (boundName) {
                if(this["_init"+boundName])return;
                var self = this,bound = self._data[boundName];
                if(!bound||nx.is(bound,nx.data.ObservableObject))return;
                var obsBound = new nx.data.ObservableObject(bound);
                var aces = bound.ace;
                var obsAceCollection = new nx.data.ObservableCollection();
                nx.each(aces, function (ace) {
                    var obsAce = new odl.acl.model.Ace(ace);
                    obsAceCollection.add(obsAce);
                });
                obsBound.set('ace', obsAceCollection);
                self.set(boundName, obsBound);
                this["_init"+boundName]=true;
            },
            removeAce: function (ace) {

            },
            _toJson: function () {
                return toJson(this);
            }
        }
    });

    nx.define('odl.acl.model.Ace', nx.data.ObservableObject, {
        properties: {
            isEdit: {
                set: function (value) {
                    if (value === true) {
                        this.itemClass('');
                    }
                    this._isEdit = value;
                }
            },
            editType: 'edit',//edit or add
            editingData: {
                set: function (value) {
                    if (value) {
                        this.editingDataList([value]);
                    } else {
                        this.editingDataList(null);
                    }
                    this._editingData = value;
                }
            },
            editingDataList: null,
            isDeleting: false,
            itemClass: '',
            isPure: false,
            'protocolStr': {
                get: function () {
                    var typeStr = 'ip';
                    var type = this._data['protocol'] + "";
                    switch (type) {
                        case '1':
                            typeStr = 'icmp';
                            break;
                        case '6':
                            typeStr = 'tcp';
                            break;
                        case '17':
                            typeStr = 'udp';
                            break;
                        case '132':
                            typeStr = 'sctp';
                            break;
                    }

                    return typeStr;
                },

                set: function (val) {
                    this.data['protocol'] = val;
                }
            },
            sourceIpStr: {
                get: function () {
                    return getIpStr.call(this, 'source');
                }
            },
            destIpStr: {
                get: function () {
                    return getIpStr.call(this, 'destination');
                }
            },
            editPortTabIdx: {
                get: function () {
                    var protocol = this.get('protocol');
                    return (protocol == '1' || protocol == '') ? -1 : '';
                }
            },
            editSourcePort2TabIdx: {
                get: function () {
                    var protocol = this.get('protocol');
                    var portMode = this.get('source-port').get('port-mode');
                    return (protocol == '1' || protocol == '') ? -1 : portMode == 'range' ? '' : -1;
                }
            },
            editDestinationPort2TabIdx: {
                get: function () {
                    var protocol = this.get('protocol');
                    var portMode = this.get('destination-port').get('port-mode');
                    return (protocol == '1' || protocol == '') ? -1 : portMode == 'range' ? '' : -1;
                }
            }
//            nextHop:{
//                get:function(){
//                    var hopData = this._data['next-hop'];
//                    var hopStr = '';
//                    if(hopData){
//                        var hop1 = hopData['next-hop-1'];
//                        var vrf1 = hopData[''];
//                    }
//                }
//            },

        },
        methods: {
            init: function (data) {
                data = this._parseData(data);
                this.inherited(data);
                var self = this;
                this.watch('protocol', function () {
                    self.notify('editPortTabIdx');
                    self.notify('editSourcePort2TabIdx');
                    self.notify('editDestinationPort2TabIdx');
                });
                this.get('source-port').watch('port-mode', function () {
                    self.notify('editSourcePort2TabIdx');
                });
                this.get('destination-port').watch('port-mode', function () {
                    self.notify('editDestinationPort2TabIdx');
                });
            },
            _parseData: function (data) {
                data = data || this._data;
                if (data) {
                    if (!data['protocol']) {
                        data['protocol'] = '';
                    }
                    nx.each(['source', 'destination'], function (type) {
                        var subKeys = [type + '-network', type + '-port'];
                        nx.each(subKeys, function (subKey) {
                            if (data[subKey] === undefined) {
                                data[subKey] = {};
//                            }
//                            if(isEmptyObj(data[subKey])){
                                if (subKey.indexOf('-network') > 0) {
                                    data[subKey] = {address: '', 'wild-card-bits': ''};
                                } else {
                                    data[subKey] = {'port-mode': 'equal', 'first-port': '', 'second-port': ''};
                                }
                            }
                            if (!nx.is(data[subKey], nx.data.ObservableObject)) {
                                data[subKey] = new nx.data.ObservableObject(data[subKey]);
                            }
                        });
                    });
                }
                return data;
            },
            _toJson: function () {
                return toJson(this);
            }
        }
    });
})(nx);