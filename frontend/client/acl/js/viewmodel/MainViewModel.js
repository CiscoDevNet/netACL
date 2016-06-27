(function (nx) {
    var searchTimeout = null;
    var maxResultH = 400;
    nx.define('odl.acl.viewmodels.MainViewModel', nx.ui.Component, {
        properties: {
            topoData: {
            },
            topo: null,
            terminalWindows: {
                get: function () {
                    return this._terminalWindows || {};
                }
            },
            terminalService: {
                value: null
            },
            viewMode: {
                get: function () {
                    var mode = this._viewMode || 'search';
                    return 'view-mode ' + mode;
                },
                set: function (value) {
                    if (value != 'search') {
                        this.expandWatchList(false);
                        this.expandResultList(false);
                        this.watchListSelectable(false);
                    } else {
                        this.isDeviceSlideDown(false);
                        this.watchListSelectable(true);

                        this.selectedAcl(null);
                        this.selectedDeviceForAcl(null);
                        this.selectedInterfaceForAcl(null);
                        this.editAce(null);
                    }
                    this._viewMode = value;
                }
            },
            editMode: {
                get: function () {
                    return this._editMode || 'view';
                },
                set: function (value) {
                    this._editMode = value;
                    value == 'edit' && this._setDefaultSelectedDevice(true);
                }
            },
            isDeviceSlideDown: false,
            /**
             * @param nx.data.ObservableDictionary
             */
            searchResultList: {
                set: function (value) {
                    var target = this._searchResultList;
                    if (target/* && target.count()*/) {
                        this._searchResultList = new this._searchResultListClass()
                        this._lastScollIndex = 0;
                        this._lastSearchResultDict && this._lastSearchResultDict.clear() && (this._lastSearchResultDict = null);
                        if (value && value.count() && nx.is(value, nx.data.ObservableDictionary)) {
                            this._lastSearchResultDict = value;
                            this.scrollResultPage.call(this);
                            var self = this;
                            setTimeout(function () {
                                self.highlightNodesInDict(value);
                            }, 0);
                        }
                    } else {
                        this._searchResultList = value;
                    }
                }
            },
            watchList: null,
            searchKey: {
                set: function (value) {
                    this._searchKey = value;
                    this.search(value);
                }
            },
            /**
             * selected interfaces of search result list
             */
            selectedInterfaces: null,
            /**
             * selected interfaces in the watch list for acl list
             */
            selectedWatchedInterfaces: null,
            watchListInfo: {
                dependencies: ['watchList'],
                get: function () {
                    var watchList = this.watchList();
                    var watchInfo = "no interface in your watchlist";
                    if (watchList.count()) {
                        var interfaceCount = 0;
                        watchList.values().each(function (item, key) {
                            interfaceCount += item.count();
                        });
                        watchInfo = '<label class="text-primary">' + interfaceCount
                            + '</label> interface(s),<label class="text-primary">'
                            + watchList.keys().count() + "</label> node(s) selected";
                    }
                    return watchInfo;
                }
            },
            expandWatchList: false,
            isResultListExpand: {
                set: function (value) {
                    if (value) {
                        if (this.expandWatchList()) {
                            this.expandWatchList(false);
                        }
                    }
                    this._isResultListExpand = value;
                }
            },
            resultContainerHeight: "0px",
            isAllWatchedInterfacesSelected: {
                get: function () {
                    var isAll = this.watchList().count() ? true : false;
                    this.watchList().values().each(function (value) {
                        if (isAll && !value.isAllSelected()) {
                            isAll = false;
                            return false;
                        }
                    });
                    return isAll;
                },
                set: function (value) {
                    this.watchList().each(function (item) {
                        item.value().isAllSelected(value);
                    });
                }
            },
            selectedInterfaceForAcl: {
                set: function (value) {
                    var oldVal = this.selectedInterfaceForAcl();
                    if (oldVal) {
                        oldVal.set('selectedForAcl', false);
                        oldVal.notify('selectedForAcl');
                    }

                    if (value) {
                        value.set('selectedForAcl', true);
                        value.notify('selectedForAcl');
                        this.selectAclInterface(value);
                    }
                    this._selectedInterfaceForAcl = value;
                }
            },
            selectedDeviceForAcl: {
                set: function (value) {
                    var oldVal = this.selectedDeviceForAcl();
                    if (oldVal) {
                        oldVal.set('selectedForAcl', false);
                        oldVal.notify('selectedForAcl');
                    }

                    if (value) {
                        value.set('selectedForAcl', true);
                        value.notify('selectedForAcl');
                        this.selectedInterfaceForAcl(value.getItem(0));
                    } else {
                        this.selectedInterfaceForAcl(null);
                    }
                    this._selectedDeviceForAcl = value;
                }
            },
            watchListSelectable: true,
            selectedAcl: {
                set: function (val) {
                    var self = this;
//                    nx.each(['inbound','outbound'],function(type){
//                        var bound = val.get(type);
//                        if(!bound){
//                            var bound = new nx.data.ObservableObject({
//                                'acl-name':'Unnamed'
//                            });
//                            var aceList = new nx.data.ObservableCollection();
//                            self._makePureAce(aceList);
//                            bound.set('ace',aceList);
//                            val.set(type,bound);
//                        }
//                    });
                    if (val) {
                        this.selectedAcl(null);
//                        var judgeAceList = function (bound) {
//                            var aceList = bound.get('ace');
//                            aceList.count() === 0 && self._makePureAce(aceList);
//                        }
                        var inbound = val.get('inbound');
                        var outbound = val.get('outbound');
                        if (!inbound || !outbound) {
                            if (!inbound && !outbound) {
                                this.enableBound('all');
                                this.selectedInboundAceList(null);
                                this.selectedOutboundAceList(null);
                            } else if (!outbound) {
//                                judgeAceList(inbound);
                                this.editBoundType('inbound');
                                this.enableBound('inbound');
                                this.selectedOutboundAceList(null);
                            } else {
//                                judgeAceList(outbound);
                                this.editBoundType('outbound');
                                this.enableBound('outbound');
                                this.selectedInboundAceList(null);
                            }
                        }

                    }
                    this._selectedAcl = val;
                    if (val) {
                        this.initBoundAceOfAcl();
                        var editBoundType = this.editBoundType();
                        if (editBoundType == 'inbound') {
                            this.selectedOutboundAceList(null);
                        } else if (editBoundType == 'outbound') {
                            this.selectedInboundAceList(null);
                        }
                    } else {
                        this.selectedOutboundAceList(null);
                        this.selectedInboundAceList(null);
                    }
                }
            },
            editAce: {
                set: function (value) {
                    var old = this.editAce();
                    if (old) {
                        value && old.itemClass('hide');
                        old.isEdit(false);
                        setTimeout(function () {
                            old.itemClass('');
                        }, 600);
                        old.editingData(null);
                    }
                    if (value) {
                        var setEdit = function () {
                            value.isEdit(true);
                        }
                        if (old) {
                            var self = this;
                            setEdit.call(self);
                        } else {
                            setEdit.call(this);
                        }
                        this.editAce(null);//for performence
                    }
                    this._editAce = value;
                }
            },
            selectedInboundAceList: null,
            selectedOutboundAceList: null,
            editBoundType: {
                set: function (value) {
                    this._editBoundType = value;
                    this.initBoundAceOfAcl();
                }
            },
            isBusy: {
                set: function (val) {
                    if (!val) {
                        this.message(null);
                    } else {
                        if (!this.message()) {
                            this.message('<i class="fa fa-spin fa-spinner"></i>Processing Data...')
                        }
                    }
                    this._isBusy = val;
                }
            },
            message: null,
            enableBound: 'none',
            isBatchCheck: {
                get: function () {
                    return this._isBatchCheck;
                },
                set: function (value) {
                    this._updateEditModeByBatchCheck.call(this, value);

                    if (value) {
                        var self = this;
                        this.editTemplateMode('choose-template');
                        this.isBusy(true);
                        var commonBack = function () {
                            self.isBusy(false);
                        }
                        var templateUrl = odl.acl.Config.get('getAclTemplateUrl');

                        // rest call to aclTemplateUrl here
                        this._topoClient.GET(templateUrl, null, function (data) {
                            commonBack.call(this);
                            data && self.aclTemplateList(data.template);
                        }, function () {
                            commonBack.call(this);
                        });
                    }

                    this._isBatchCheck = value;
                }
            },
            aclTemplateList: {
                set: function (value) {
                    if (value) {
                        this.aclTemplateList(null);
                    }
                    this._aclTemplateList = value;
                }
            },
            editTemplateMode: 'choose-template',
            isDeployModalShow: false
        },
        methods: {
            init: function () {
                this.inherited();

                var self = this;
                //setup topology
                var url = odl.acl.Config.get('topoDataUrl');
                this._topoClient = new nx.ServiceClient();

                var commonBack = function (data) {
                    var msg = '\n{url}/restconf/operational/network-topology:network-topology/topology/example-linkstate-topology/\n\
{url}/restconf/operational/bgp-rib:bgp-rib/rib/example-bgp-rib/loc-rib/tables/bgp-types:ipv4-address-family/bgp-types:unicast-subsequent-address-family/ipv4-routes\n\
{url}/restconf/config/opendaylight-inventory:nodes/\n'.replace(/\{url\}/g, url);
                    if (data && data.nodes) {
                        nx.each(data.nodes, function (node) {
                            msg += '{url}/restconf/config/opendaylight-inventory:nodes/node/{nodeName}/yang-ext:mount/Cisco-IOS-XR-ifmgr-cfg:interface-configurations\n'
                                .replace(/\{url\}/g, url).replace(/\{nodeName\}/g, node.name);
                        });
                    }
                    console.log('Get topology used apis: ' + msg);
                }

                // REST call to topoDataUrl here
                this._topoClient.GET(url, {}, function (data) {
                    data.nodes = data.nodes || [];
                    nx.each(data.nodes, function (node) {
                        var mdata = mapData[node.name];
                        if (mdata) {
                            node.latitude = mdata.latitude;
                            node.longitude = mdata.longitude;
                        } else {
                            node.latitude = 47.6062;
                            node.longitude = -122.332;
                        }
                    });
//                    var data = new TopologyDataGenerator(1000, 170, self.topo().layoutType()).toTopoData();
                    self.topoData(data);
                    commonBack.call(self, data);
                }, function () {
                    console.log('error', arguments);
                    commonBack.call(self);
                });

                this.watchList(new nx.data.ObservableDictionary());
                this.watchList().on('change', function (sender, data) {
                    self.notify('watchListInfo');
                    if (data.action == 'clear') {
                        self.topo().selectedNodes().clear();
                    }
                });


                var SearchResultListClass = this._searchResultListClass = nx.define(nx.data.ObservableDictionary, {
                    methods: {
                        clear: function () {
                            this.inherited();
                            var me = this;
                            setTimeout(function () {
                                self.highlightNodesInDict(me, true);
                            }, 0);
                        }
                    }
                });
                this.searchResultList(new SearchResultListClass());
//                this.searchResultList().on('change', function (sender, data) {
//                    var nodes = [];
//                    if (data.action != 'clear') {
//                        var items = data.items;
//                        nx.each(items, function (item) {
//                            var intf = item._value;
//                            var node = intf.node();
//                            nodes.push(node);
//                        });
//                    }
//                    self._highlightNodes(nodes, true);
//                });g

//                var oldClear = this.searchResultList().clear;
//                this.searchResultList().clear = function () {
//                    oldClear.call(self.searchResultList());
//                    setTimeout(function () {
//                        self.highlightNodesInDict(self.searchResultList(), true);
//                    }, 0);
//                }
                this.selectedInterfaces(new nx.data.Collection());
                this.selectedWatchedInterfaces(new nx.data.ObservableDictionary());
                this.terminalService(new odl.TerminalService(odl.acl.Config.get('socketUrl')));
                this.terminalWindows(new nx.data.ObservableDictionary());
            },
            search: function (key) {
                var self = this;
                searchTimeout && clearTimeout(searchTimeout);
                if (!key) {
                    if (!this.isResultListExpand()) {
                        searchTimeout = setTimeout(function () {
                            self.searchResultList().clear();
                        }, 300);
                    } else {
                        self.expandResultList(new nx.data.ObservableDictionary());
                    }
                    return;
                }
                searchTimeout = setTimeout(function () {
                    self.selectedInterfaces().clear();
                    var dict = self._search(key);
                    self.expandResultList(dict);
                }, 300);
            },
            expandResultList: function (param) {
                var self = this;
                if (param === true || param === false) {
                    self.isResultListExpand(param);
                    var height = param ? maxResultH : 0;
                    self.resultContainerHeight(height + 'px');
                } else if (nx.is(param, nx.data.ObservableDictionary)) {
                    var resultDict = param;
                    if (resultDict.count() && !self.isResultListExpand()) {
                        self.isResultListExpand(true);
                    } else if (!resultDict.count() && self.isResultListExpand()) {
                        self.isResultListExpand(false);
                    }

                    var height = self._computeResultContainerH(resultDict);
                    var oldH = self.resultContainerHeight();
                    if (parseInt(oldH) < parseInt(height)) {
                        self.searchResultList(resultDict);
                        self.resultContainerHeight(height);
                    } else {
                        var setResultDict = function () {
                            self.searchResultList(resultDict);
                        }
                        if (oldH != height) {
                            self.resultContainerHeight(height);
                            searchTimeout = setTimeout(setResultDict, 300);
                        } else {
                            setResultDict();
                        }
                    }
                }
            },
            scrollResultPage: function () {
                var resultSearchDict = this._lastSearchResultDict;
                var resultListDict = this.searchResultList();
                var pageSize = this._pageSize || 20;
                var startIdx = this._lastScollIndex;
                var endIdx = startIdx + pageSize;
                var map = resultSearchDict._map;
                var i = 0;
                for (var key in map) {
                    if (map.hasOwnProperty(key)) {
                        if (i >= endIdx) {
                            this._lastScollIndex = i;
                            break;
                        }
                        var item = map[key];
                        var value = item.value();
                        if (i >= startIdx) {
                            resultListDict.setItem(key, value);
                        }
                        i += value.count();
                    }
                }
            },
            onSearchResultListScroll: function (sender, event) {
                var list = sender.dom(),
                    ul = list.childAt(0);
                if (list.$dom.scrollTop + list.$dom.offsetHeight
                    - parseInt(list.getStyle('paddingTop')) - parseInt(list.getStyle('borderTopWidth'))
                    >= ul.$dom.offsetHeight) {
                    this.scrollResultPage();
                }
            },
            highlightNodesInDict: function (dict) {
                var nodes = [];
                dict.each(function (item) {
                    var intf = item.value();
                    var node = intf.node();
                    nodes.push(node);
                });
                this._highlightNodes(nodes, true);
            },
            /**
             *
             * @param nodes Array
             * @private
             */
            _highlightNodes: function (nodes, recover) {
                var topo = this.topo();
                var nl = topo.getLayer('nodes');
                var highlightedElements = nl.highlightedElements();
                if (recover) {
                    var layers = topo.layers();
                    nx.each(layers, function (layer) {
                        layer.fadeIn(true);
                    });
                }
                if (!nodes.length) {
                    highlightedElements.clear();
                    return;
                }
                var ll = topo.getLayer('links');
                nx.each(nodes, function (node) {
                    var topoNode = topo.getNode(node.id);
                    highlightedElements.add(topoNode);
                });
                nl.fadeOut(true);
                ll.fadeOut(true);
            },
            _matchProp: function (keyToMatch, obj, props, caseSensitive) {
                if (!keyToMatch) {
                    return false;
                }
                props = props || ['name'];
                var matched = true;
                var keys = keyToMatch.trim().replace(/\s{2,}/g, " ").split(' ');
                for (var j = 0, keyLen = keys.length; j < keyLen && matched; j++) {
                    matched = false;
                    var key = keys[j];
                    if (!key)continue;
                    for (var i = 0, len = props.length; i < len && !matched; i++) {
                        var prop = props[i];
                        var val = obj[prop];
                        if (!caseSensitive && val) {
                            val = val.toLowerCase();
                            key = key.toLowerCase();
                        }
                        val && (matched = val.indexOf(key) > -1);
                    }
                    if (!matched)break;
                }

                return matched;
            },
            _search: function (key, resultDict) {
                var self = this;
                if (!resultDict) {
                    resultDict = new nx.data.ObservableDictionary();
                }
                var keys = key.trim().replace(/\s{2,}/g, " ").split(' ');
                if (keys.length > 1) {
                    var resultDict = self._search(keys[0]);
                    for (var i = 1, len = keys.length; i < len; i++) {
                        resultDict = self._search(keys[i], resultDict);
                    }
                } else if (resultDict.count()) {
                    resultDict.each(function (item, dictKey) {
                        if (dictKey.indexOf(key) > -1) {
                            return true;
                        }
                        var interfaces = item.value();
                        var unmatch = [];
                        interfaces.each(function (intf) {
                            if (!self._matchProp(key, intf._data, ['name'])) {
                                unmatch.push(intf);
                            }
                        });
                        nx.each(unmatch, function (intf) {
                            interfaces.remove(intf);
                        })
                        if (/*dictKey.indexOf(key) < 0 &&*/ !interfaces.count()) {
                            resultDict.removeItem(dictKey);
                        }
                    });
                } else {
                    var data = this.topoData();
                    var nodes = data.nodes;
                    var self = this;
                    nx.each(nodes, function (node) {
                        var interfaces = node.interface;
                        if (self._matchProp(key, node, ['name'])) {//name matched up!
                            var obsCol = self._makeObsInterfaceCollection(node);
                            nx.each(interfaces, function (intf) {
                                var obsIntf = self._makeObservableInterface(intf, node);
                                obsCol.add(obsIntf);
                            });
                            resultDict.setItem(node.name, obsCol);
                        } else {
                            nx.each(interfaces, function (intf) {
                                if (self._matchProp(key, intf, ['name'])) {//interface matched up!
                                    var obsCol = resultDict.getItem(node.name) || self._makeObsInterfaceCollection(node);
                                    var obsInft = self._makeObservableInterface(intf, node);
                                    obsCol.add(obsInft);
                                    obsCol.count() == 1 && resultDict.setItem(node.name, obsCol);
                                }
                            })
                        }
                    });
                }

                return resultDict;
            },
            _clearSearchResultList: function () {
                this.searchResultList(new nx.data.ObservableDictionary());
            },
            _clearWatchList: function () {
                var self = this;
                this.expandWatchList(false);
                setTimeout(function () {
                    self.watchList().clear();
                    self.selectedWatchedInterfaces().clear();
                    self.selectedDeviceForAcl(null);
                }, 600);
            },
            _makeObsInterfaceCollection: function (node) {
                var obsInterfaceCol = new odl.acl.ObsInterfaceCollection(node);
                var self = this;
                obsInterfaceCol.on('select', function (sender, item) {
                    var selected = self.selectedInterfaces();
                    obsInterfaceCol.notify('isAllSelected');
                    if (item.get('selected')) {
                        !self._containsInCollection(selected, item) && selected.add(item);
                    } else {
                        self._removeInCollection(selected, item);
                    }
                });
                return obsInterfaceCol;
            },
            _moveTopoTo: function (sender, targetName) {
                var topoView, targetView;
                var mainView = sender.owner().owner();
                var topo = this.topo();
                if (targetName == 'acl') {
                    topoView = mainView.view('topology-container');
//                    topoView.states({
//                        enter: {
//                        opacity: 0,
//                        border: '1px solid red',
//                        duration: 10000}
//                    });
//                    topo.height(300);
//                    topo.width(500);
//                    topo.fit();
                    targetView = mainView.view('acl-view-panel').view('acl-topo-container');
                } else {
                    topoView = mainView.view('acl-view-panel').view('acl-topo-container').resolve('topology-container');
//                    topo.adaptToContainer(true);
                    targetView = mainView;
                }
                topoView.attach(targetView);
                topo.adaptToContainer(true);
            },
            _backToSearch: function (sender) {
                this.switchViewModeTo('search', sender);
            },
            _makeObservableInterface: function (intf, node) {
                var obsIntf = new nx.data.ObservableObject(intf);
                obsIntf.sets({
                    selected: false,
//                    watched:false,
                    node: node
                });
                return obsIntf;
            },
            _selectInterfaceNodes: function (node, isSelected) {
                var self = this;
                var topo = self.topo();
                var selectedTopoNodes = topo.selectedNodes();
                var topoNode = topo.getNode(node.id);
                if (isSelected) {
                    selectedTopoNodes.indexOf(topoNode) < 0 && selectedTopoNodes.add(topoNode);
                } else {
                    selectedTopoNodes.remove(topoNode);
                }
            },
            _addToWatch: function (sender) {
                var selectedInterfaces = this.selectedInterfaces();
                if (!selectedInterfaces.count())return;
                var watchList = this.watchList();
                var self = this;
                selectedInterfaces.each(function (intf) {
                    var node = intf.get('node');
                    var watched = false;
                    watchList.each(function (item) {
                        var key = item.key();
                        var value = item.value();
                        if (key == node.name) {
                            var cloneIntf = self._cloneInterface(intf);
                            !self._containsInCollection(value, intf) && value.add(cloneIntf);
                            cloneIntf.set('selected', true);
                            watched = true;
                        }
                    });
                    if (!watched) {
                        var cloneIntf = self._cloneInterface(intf);
                        var obsInterfaceCol = new odl.acl.ObsInterfaceCollection(node);
                        obsInterfaceCol.on('select', function (sender, item) {
                            if (self.viewMode() == 'acl')return;

                            sender.notify('isAllSelected');
                            self.notify('isAllWatchedInterfacesSelected');
                            var selected = self.selectedWatchedInterfaces();
                            var nodeName = node.name;
                            var col = selected.getItem(nodeName);
                            if (item.get('selected')) {
//                                !selected.contains(item) && selected.add(item);
                                if (col && !self._containsInCollection(col, item)) {
                                    col.add(self._cloneInterface(item));
                                } else if (!col) {
                                    col = new odl.acl.ObsInterfaceCollection(node);
                                    col.add(item);
                                    selected.setItem(nodeName, col);
                                }
                            } else {
//                                selected.remove(item);
                                if (col && self._containsInCollection(col, item)) {
                                    self._removeInCollection(col, item);
                                    if (item == self.selectedInterfaceForAcl()) {
                                        self.selectedInterfaceForAcl(null);
                                    }
                                    if (!col.count()) {
                                        selected.removeItem(nodeName);
                                        if (col == self.selectedDeviceForAcl()) {
                                            self.selectedDeviceForAcl(null)
                                        }
                                    }
                                }
                            }
                            //for Acl
                            self.selectedDeviceForAcl() != col && col.set('selectedForAcl', false);
                            self.selectedInterfaceForAcl() != item && item.set('selectedForAcl', false);

//                            this.notify('hasSelectedItem');
                            self._selectInterfaceNodes(node, this.hasSelectedItem());
                        });
                        obsInterfaceCol.add(cloneIntf);
                        watchList.setItem(node.name, obsInterfaceCol);
                        cloneIntf.set('selected', true);
                    }
                });
                this.notify('watchListInfo');
                while (selectedInterfaces.count()) {
                    selectedInterfaces.getItem(0).set('selected', false);
                }
                this.expandResultList(false);
                this.expandWatchList(true);
                self.searchKey('');
            },
            _setDefaultSelectedDevice: function (force) {
                var self = this;
                var selectedWatchedInterfaces = self.selectedWatchedInterfaces();
                if (!self.selectedDeviceForAcl() || force) {
                    var key0 = null;
                    for (var i in selectedWatchedInterfaces._map) {
                        key0 = i;
                        break;
                    }
                    var selectedDeviceForAcl = selectedWatchedInterfaces.getItem(key0);
                    if (selectedDeviceForAcl == self.selectedDeviceForAcl()) {
                        self.selectAclInterface(self.selectedInterfaceForAcl() || selectedDeviceForAcl.getItem(0));
                    } else {
                        self.editBoundType('inbound');
                        self.selectedDeviceForAcl(selectedDeviceForAcl);
                    }
                }
            },
            _cloneInterface: function (intf) {
                var data = nx.clone(intf._data);
                var cloneIntf = new nx.data.ObservableObject(data);
                cloneIntf.set('selected', false);
                return cloneIntf;
            },
            _compareInterface: function (intf1, intf2) {
                return intf1.get('node').id === intf2.get('node').id && intf1.get('name') === intf2.get('name');
            },
            _containsInCollection: function (col, intf) {
                var contain = false;
                var self = this;
                nx.each(col, function (i) {
                    !contain && (contain = self._compareInterface(i, intf));
                });
                return contain;
            },
            _removeInCollection: function (col, intf) {
                var over = false;
                var self = this;
                nx.each(col, function (i) {
                    if (!over && self._compareInterface(i, intf)) {
                        col.remove(i);
                        over = true;
                    }
                });
                return over;
            },
            _toggleExpandWatchList: function () {
                if (this._viewMode && this._viewMode != 'search') {
                    return;
                }
                if (!this.watchList().count()) {
                    return;
                }
                var expand = this.expandWatchList();
                this.expandWatchList(!expand);
                if (expand) {
                    if (this.searchResultList().count()) {
                        this.expandResultList(true);
                    }
                } else {
                    this.expandResultList(false);
                }
            },
            _computeResultContainerH: function (resultDict) {
//                var resultList = resultDict;
                var nodeCount = resultDict.keys().count();
                var height = 0;
                if (nodeCount) {
                    var interfaceCount = 0;
                    resultDict.each(function (item) {
                        interfaceCount += item.value().count();
                    });
                    height = (nodeCount + interfaceCount) * 25 + 35 + 10;
                }

                return (height > 400 ? 400 : height) + "px";
            },
            _toggleSelectAllWatchedInterfaces: function (sender) {
                if (!this.watchListSelectable())return;
                this.isAllWatchedInterfacesSelected(!this.isAllWatchedInterfacesSelected());
            },
            _onSearchInputFocus: function (sender) {
                if (this.searchKey() && !this.isResultListExpand() && this.searchResultList().count()) {
                    this.expandResultList(true);
                }
            },
            _clickTopo: function (sender, event) {
                //this.topo().currentScene().clickStage(sender, event);
                this.expandResultList(false);
            },
            switchViewModeTo: function (mode, sender) {
                var self = this;
                var topo = self.topo();

                this.viewMode(mode, sender);

                var nl = topo.getLayer("nodes");
                var ll = topo.getLayer("links");

                topo.view().dom().setStyles({
                    'transition': 'all .6s'
                });
                var tm = topo.tooltipManager();
                if (mode == 'acl') {
                    tm.tooltips().getItem('nodeTooltip').close();
                    tm.showNodeTooltip(false);

                    var selectedNodes = topo.selectedNodes().toArray();
                    if (!selectedNodes.length) {
                        selectedNodes = [];
                        this.watchList().each(function (item) {
                            var node = item.value().node();
                            var topoNode = topo.getNode(node.id);
                            selectedNodes.push(topoNode);
                        });
                    }
                    var nodesBound = topo.getBoundByNodes(selectedNodes);


                    if (nodesBound.width < 200) {
                        nodesBound.left -= (200 - nodesBound.width) / 2;
                        nodesBound.width = 200;
                    }

                    if (nodesBound.height < 200) {
                        nodesBound.top -= (200 - nodesBound.height) / 2;
                        nodesBound.height = 200;
                    }

                    var bound = {left: 0, top: 0, width: 400, height: 400};
                    topo.adaptive(false);
//                    topo.resize(400, 400);

                    var stage = topo.stage();
                    stage.scalingLayer().setTransition(function () {
                        topo.adjustLayout();
                    }, null, 0.6);
                    stage.applyStageMatrix(stage.calcRectZoomMatrix(bound, nodesBound));
                } else {
                    tm.showNodeTooltip(true);
                    topo.adaptive(true);
//                    topo.view().dom().setStyle('-webkit-transition','');
                    topo.resize(document.body.offsetWidth, document.body.offsetHeight);
                    topo.fit();
//                    setTimeout(function(){
//                        topo.adaptToContainer();
//                    },850);
                }
            },
            _updateEditModeByBatchCheck: function (batchCheck) {
                if (batchCheck && this.editMode() != 'add') {
                    this.editMode('add');
                } else if (!batchCheck && this.editMode() != 'edit') {
                    this.editMode('edit');
                }
            },
            _toAddTemplateAcl: function (sender) {
                var model = sender.model();
                if (model == this) {
                    model = {acl: {ace: []}};
                } else {
                    model = nx.deepClone(model);
                }
                console.log(model);
                var aclData = model.acl;
                aclData.inbound = {'acl-name': 'Unnamed ACL', ace: aclData.ace};
                delete aclData.ace;
                var acl = new odl.acl.model.Acl(aclData);
                this.editTemplateMode('edit-by-template');
                this.selectedAcl(acl);
                var ace = aclData.inbound.get('ace');
                if (ace.count() == 1 && ace.getItem(0).isPure()) {
                    this._toAddAce();
                }
            },
            cancelEditByTemplate: function (sender) {
                this.selectedAcl(null);
                this.editTemplateMode('choose-template');
            },
            _toAddAcl: function (sender) {
                try {
                    this.switchViewModeTo('acl', sender);
                } catch (ex) {
                    console.log(ex);
                }
                var self = this;
//                var selected = this.selectedDeviceForAcl();
//                selected.each(function(item){
//                    item.set('selectedForAcl',true);
//                    item.notify('selectedForAcl');
//                });
//                this.editMode('add');
                var oldBatchCheck = this.isBatchCheck();
                if (oldBatchCheck) {
                    this._updateEditModeByBatchCheck(oldBatchCheck);
                    this.editTemplateMode('choose-template');
                } else {
                    this.isBatchCheck(true);
                }

                if (!self.selectedDeviceForAcl()) {
                    this._setDefaultSelectedDevice();
                }
            },
            _viewAcl: function (sender) {
                this.isBatchCheck(false);
                if (this.editMode() == 'edit') {
                    this._setDefaultSelectedDevice(true);
                }
                this.editMode('edit');
                this.switchViewModeTo('acl', sender);
            },
            _deleteAcl: function (sender) {
                //this.viewMode('acl');
                this.deployAcl(sender, 'delete');
            },
            _onSelectDevice: function (sender) {
                var col = sender.model().value();
                this.selectedDeviceForAcl(col);
            },
            selectAclInterface: function (interfaceModel) {
                if (this.editMode() == 'add')return;
                var node = interfaceModel.get('node');
                var self = this;
                this.enableBound('none');
                this.isBusy(true);
                var nodeName = node.name;
                var intfName = interfaceModel.get('name');
                var backCommon = function () {
                    this.isBusy(false);
                    var bound = this.selectedAcl().get(this.editBoundType());
                    var aclName = 'undefined';
                    bound && (aclName = bound.get('acl-name'));
                    console.log('Get acl used api:  http://{host}:8080/restconf/config/opendaylight-inventory:nodes/node/{nodeName}/yang-ext:mount/Cisco-IOS-XR-ipv4-acl-cfg:ipv4-acl-and-prefix-list/accesses/access/{aclName}'
                        .replace(/\{nodeName\}/gi, nodeName).replace(/\{aclName\}/gi, aclName).replace(/\{host\}/g, location.hostname));
                }
                this._getAcl(nodeName, intfName, function (data) {
                    var acl = new odl.acl.model.Acl(data);
                    self.selectedAcl(acl);
                    backCommon.call(self);
                }, function () {
                    backCommon.call(self);
                });
            },
            _onSelectAclInterface: function (sender) {
                if (this.editMode() == 'add')return;
                var selected = sender.model();
                this.selectedInterfaceForAcl(selected);
            },
            _getAcl: function (nodeName, intfName, callback, error) {
                var getAclUrl = odl.acl.Config.get('getAclUrl');
                var client = this._topoClient;
                var realUrl = getAclUrl.replace('{nodeName}', nodeName).replace('{intfName}', intfName);
                // rest call to aclUrl here
                client.GET(realUrl, null, callback, error);
            },
            _toEditAce: function (sender) {
                var ace = sender.model();
//                ace.isEdit(true);
                this.editAce(ace);
                var data = ace._toJson();
//                delete data['sequence-number'];
//                var old = this.editingAce();
//                if(old){
//                    nx.path(old,'source-network.address','192.168.1.1');
//                }

                var editingAce = new odl.acl.model.Ace(data);
                editingAce.editType('edit');

                ace.editingData(editingAce);
            },
            _toAddAce: function (sender, event, ace) {
                var ace = sender ? sender.model() : this.selectedAcl().get('inbound').get('ace').getItem(0);
                if (!nx.is(ace, odl.acl.model.Ace)) {
                    ace = null
                }
                this.editAce(ace);
                var editingAce = new odl.acl.model.Ace({
                    'sequence-number': '',
                    protocol: '',
                    grant: 'deny'
                });
                editingAce.editType('add');
                ace.editingData(editingAce);
            },
            _makePureAce: function (aceList) {
                var pureAce = new odl.acl.model.Ace({});
                pureAce.isPure(true);
                console.log('pureAce', pureAce);
                aceList.add(pureAce);
            },
            deleteAce: function (ace) {
                ace.isDeleting(true);
                var self = this;
                setTimeout(function () {
//                    ace.fire('remove', {type: self.editBoundType()});
                    var aceList = self.selectedAcl().get(self.editBoundType()).get('ace');
                    aceList.remove(ace);
//                    self.notify("isEditAceListEmpty");
                    ace.isDeleting(false);

                    if (aceList.count() == 0) {
                        self._makePureAce(aceList);
                    }

                }, 500);
            },
            _deleteAce: function (sender) {
                var ace = sender.model();
                this.deleteAce(ace);
                ace.isDeleting(true);
                var self = this;
                setTimeout(function () {
//                    ace.fire('remove', {type: self.editBoundType()});
                    var aceList = self.selectedAcl().get(self.editBoundType()).get('ace');
                    aceList.remove(ace);
//                    self.notify("isEditAceListEmpty");
                    ace.isDeleting(false);

                    if (aceList.count() == 0) {
                        var pureAce = new odl.acl.model.Ace({});
                        pureAce.isPure(true);
                        console.log('pureAce', pureAce);
                        aceList.add(pureAce);
                    }

                }, 500);
            },
            _cancelEditAce: function (sender) {
                this.editAce(null);
            },
            _saveEditAce: function (sender) {
                var editingAce = this.editAce().editingData();
                var data = editingAce._toJson();
                var validatedData = this.validateAceData(data);
                var editAce = this.editAce();
                if (editingAce.editType() == 'edit') {
                    editAce._data = validatedData;
                    editAce._parseData();
                    editAce.notify('*');
                } else {
                    var newAce = new odl.acl.model.Ace(validatedData);
                    var bound = this.selectedAcl().get(this.editBoundType());
                    var aceList = bound.get('ace');
                    var idx = aceList.indexOf(editAce);
                    aceList.insert(newAce, idx + 1);
                    if (editAce.isPure() == true) {
                        this.deleteAce(editAce);
                    }
//                    bound.notify('ace');
                }
                this.editAce(null);
            },
            validateAceData: function (data) {
//                var isOk = true;
                var protocol = data['protocol'];
                if (protocol === '')delete data['protocol'];
                nx.each(['source', 'destination'], function (type) {
                    var portData = data[type + '-port'];
                    if (protocol == 1 || protocol == '' || !portData['first-port']) {
                        delete  data[type + '-port'];
                    }
                    var netData = data[type + '-network'];
                    if (!netData['address']) {
                        delete data[type + "-network"];
                    }
                });

                return data;

            },
            setEditBoundType: function (type) {
                this.editBoundType(type);
            },
            _setEditBoundType: function (sender) {
                console.log(sender);
                if (sender.dom().hasClass('is-inbound')) {
                    this.setEditBoundType('inbound');
                } else if (sender.dom().hasClass('is-outbound')) {
                    this.setEditBoundType('outbound');
                }
            },
            initBoundAceOfAcl: function () {
                var selectedAcl = this.selectedAcl(), boundType = this.editBoundType();
                if (selectedAcl && boundType && !selectedAcl['_init' + boundType]) {
                    selectedAcl._initBound(boundType);
                    var bound = selectedAcl.get(boundType);
                    if (bound) {
                        var busy = false;
                        if (!this.isBusy()) {
                            this.isBusy(true);
                            busy = true;
                        }
                        this['selected' + boundType.charAt(0).toUpperCase() + boundType.slice(1) + 'AceList'](bound.get('ace'));
                        busy && this.isBusy(false);
                        var self = this;
                        var judgeAceList = function (bound) {
                            var aceList = bound.get('ace');
                            aceList.count() === 0 && self._makePureAce(aceList);
                        }
                        judgeAceList(selectedAcl.get(boundType));
                    }
                }
            },
            deployAcl: function (sender, type) {
                var acl = this.selectedAcl();
                var editMode = this.editMode();
                var self = this;
                var url = null;
                var postData = null;
                var postType = 'POST';
                var cslMsg = '';
                var backFun = null;
                if (type == 'delete') {
                    url = odl.acl.Config.get('addAndUnbindAclUrl');
                    postData = {node: []};
                    postData.bind = this.editBoundType();
                    postData.acl = {'acl-name': acl._toJson()[postData.bind]['acl-name']};
                    var selectInterface = this.selectedInterfaceForAcl();
                    var node = selectInterface.get('node');
                    postData.node.push({name: node.name, interface: [selectInterface.get('name')]});
                    postType = 'DELETE';
                    var bondType = this.editBoundType();
                    cslMsg = 'Delete acl used api: http://{host}:8080/restconf/config/opendaylight-inventory:nodes/node/{nodeName}/yang-ext:mount/Cisco-IOS-XR-ifmgr-cfg:interface-configurations/interface-configuration/act/{intfName}/ipv4-packet-filter/' + bondType;
                    cslMsg = cslMsg.replace(/\{host\}/g, location.hostname).replace(/\{nodeName\}/g, node.name).replace(/\{intfName\}/g, selectInterface.get('name'));
                    backFun = function () {
                        self.selectedInterfaceForAcl(self.selectedInterfaceForAcl());
                    }
                } else if (editMode == 'edit') {
                    var selectedInterface = this.selectedInterfaceForAcl();
                    var node = selectedInterface.get('node');
                    url = odl.acl.Config.get('modifyAclUrl');
                    url = url.replace('{nodeName}', node.name);
                    var boundType = this.editBoundType();
                    var bound = acl.get(boundType);
                    var aceList = bound.get('ace');
                    var postData = acl._toJson();
                    postData = postData[boundType];
                    nx.each(aceList, function (ace, idx) {
                        if (ace.isPure()) {
                            postData.ace.splice(idx, 1);
                        }
                    });
                    nx.each(postData.ace, function (ace, idx) {
                        postData.ace[idx] = self.validateAceData(ace);
                    });
                    postData = {'acl': postData};
                    cslMsg = 'Deploy acl used api: http://{host}:8080/restconf/config/opendaylight-inventory:nodes/node/{nodeName}/yang-ext:mount/Cisco-IOS-XR-ipv4-acl-cfg:ipv4-acl-and-prefix-list/accesses/access/{aclName}';
                    cslMsg = cslMsg.replace(/\{host\}/g, location.hostname).replace(/\{nodeName\}/g, node.name).replace(/\{aclName\}/, this.selectedAcl().get(boundType).get('acl-name'));
//                    console.log(postData);
                    backFun = function () {
                        self.selectedInterfaceForAcl(self.selectedInterfaceForAcl());
                    }
                } else if (editMode == 'add') {
                    url = odl.acl.Config.get('addAndUnbindAclUrl');
                    var data = acl._toJson();
                    postData = {acl: data.inbound, bind: this._boundType, node: []};
                    var aceList = acl.get('inbound').get('ace');
                    nx.each(aceList, function (ace, idx) {
                        if (ace.isPure()) {
                            postData.acl.ace.splice(idx, 1);
                        }
                    });
                    nx.each(postData.acl.ace, function (ace, idx) {
                        postData.acl.ace[idx] = self.validateAceData(ace);
                    });
                    var selectInterfaces = this.selectedWatchedInterfaces();
                    selectInterfaces.each(function (item) {
                        var node = {interface: []};
                        node.name = item.key();
                        item.value().each(function (intf) {
                            node.interface.push(intf.get('name'));
                        });
                        postData.node.push(node);
                        var tempMsg = 'http://{host}:8080/restconf/config/opendaylight-inventory:nodes/node/{nodeName}/yang-ext:mount/Cisco-IOS-XR-ipv4-acl-cfg:ipv4-acl-and-prefix-list/accesses/access/{aclName}\n\
http://{host}:8080/restconf/config/opendaylight-inventory:nodes/node/{nodeName}/yang-ext:mount/Cisco-IOS-XR-ifmgr-cfg:interface-configurations';
                        cslMsg += tempMsg.replace(/\{host\}/g, location.hostname).replace(/\{nodeName\}/g, node.name).replace(/\{aclName\}/g, self.selectedAcl().get('inbound').get('acl-name')) + "\n";
                    });
                    cslMsg = "Add acl used apis:\n" + cslMsg;
                }

                var client = this._topoClient;
                this.isBusy(true);
                var commonBack = function () {
                    this.isBusy(false);
                    console.log(cslMsg);
                }
                client.send({
                    data: JSON.stringify(postData),
                    url: url,
                    contentType: 'application/json',
                    type: postType,
                    dataType: 'json',
                    success: function (resp) {
                        self.message('Deploy success');
                        setTimeout(function () {
                            commonBack.call(self);
                            backFun && backFun.call(self);
                        }, 1000);
                    },
                    error: function (resp) {
                        self.message('Deploy failed');
                        setTimeout(function () {
                            commonBack.call(self);
                        }, 1000);
                    }
                });
            },
            deployInbound: function (sender) {
                this.isDeployModalShow(true);
                this._boundType = 'inbound';
                var input = this._mainView.view('new_acl_name').dom().$dom;
                input.select();
                input.focus();
            },
            deployOutbound: function (sender) {
                this.isDeployModalShow(true);
                this._boundType = 'outbound';
                var input = this._mainView.view('new_acl_name').dom().$dom;
                input.select();
                input.focus();
            },
            _cancelDeployModal: function (sender) {
                this.isDeployModalShow(false);
            },
            confirmDeploy: function (sender) {
                this.isDeployModalShow(false);
                this.deployAcl(sender, this._boundType);
            },
            _openTerminal: function (sender, evt) {
                var model = sender.owner().node().model();
                var address = model.get('ip');
//                var port = model.port;
                var name = model.get('name');
                var terminalWindows = this.terminalWindows();
                var terminalModel = terminalWindows.getItem(name);
                var terminalService = this.terminalService();
                if (!terminalModel) {
                    var terminalModel = new nx.data.ObservableObject({
                        address: address,
                        service: terminalService,
                        title: name
                    });
                    nx.extend(terminalModel, {
                        onClose: function () {
                            terminalWindows.removeItem(name);
                        }
                    })
                    terminalWindows.setItem(name, terminalModel);
                }

                terminalModel.set('opened', true);
                terminalModel.set('maximized', true);
            },
            editAceLastInputBlur: function (sender, event) {
                console.log(sender);
                var ace = this.editAce().editingData();
                var dom = sender.dom();
                if (dom.hasClass('port') && !dom.hasClass('port2') && ace.get('destination-port').get('port-mode') == 'range')return;
                if (dom.hasClass('wcb-input') && !(ace.get('protocol') == '' || ace.get('protocol') == '1'))return;
                var editLine = dom.hasClass('wcb-input') ? sender.parent().parent() : sender.parent().parent().parent();
                if (ace.editType() == 'edit') {
                    nx.each(editLine.content(), function (child) {
                        if (child.dom().hasClass('grant')) {
                            child.dom().focus();
                        }
                    });
                } else if (ace.editType() == 'add') {
                    editLine.content().getItem(2).content().getItem(0).dom().focus();
                }
            }
        }
    });

    nx.define("odl.acl.ObsInterfaceCollection", nx.data.ObservableCollection, {
        events: ["select"],
        properties: {
            isAllSelected: {
                set: function (value) {
                    this.each(function (intf) {
                        intf.set('selected', !!value);
                    });
                },
                get: function () {
                    var isAll = this.count() ? true : false;
                    this.each(function (intf) {
                        if (isAll && !intf.get('selected')) {
                            isAll = false;
                            return false;
                        }
                    });
                    return isAll;
                }
            },
            hasSelectedItem: {
                get: function () {
                    var has = false;
                    this.each(function (intf) {
                        if (!has && intf.get('selected')) {
                            has = true;
                            return false;
                        }
                    });

                    return has;
                }
            },
            node: null,
            expand: true
        },
        methods: {
            init: function (node) {
                this.inherited();
                this.node(node);
            },
            add: function (item) {
                //item.set('beInCol', this);
                var self = this;
                item.watch('selected', function (prop, value) {
                    self.fire('select', item);
                });
                this.inherited(item);
            },
            selectAll: function () {
                var selected = this.isAllSelected();
                this.isAllSelected(!selected);
            }
        }
    });
})(nx);