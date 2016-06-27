(function (nx) {
    nx.extend(nx.Binding.converters, {
        selectIconClass: {
            convert: function (value) {
                var className = 'fa-square-o';
                if (value) {
                    className = 'fa-check-square-o';
                }
                return className;
            }
        },
        slideIconClass: {
            convert: function (value) {
                var className = 'fa-chevron-down';
                if (!value) {
                    className += ' trans-n-90deg';
                } else if (value === 0) {
                    className = 'is-visible false';
                }
                return className;
            }
        },
        visibleClass: {
            convert: function (value) {
                var className = 'is-visible';
                if (!value) {
                    className += '-false';
                } else {
                    className != '-true';
                }
                return className;
            }
        },
        disabledInverted: {
            convert: function (value) {
                return value?"":'disabled';
            }
        }
    });

    nx.define('odl.acl.views.searchPanelView', nx.ui.Component, {
        view: {
            props: {
                'class': 'search-panel',
                'tabIndex': -1
            },
            events: {
//                keydown:'{#model._keydownOnPanel}'
            },
            content: [
                {
                    props: {
                        'class': 'search-input',
                        content: [
                            {
                                name: 'searchInput',
                                tag: 'input',
                                props: {
                                    'class': 'form-control',
                                    placeholder: 'search interface name',
                                    value: "{#model.searchKey}"
                                },
                                events: {
                                    focus: '{#model._onSearchInputFocus}'
                                }
                            },
                            {
                                tag: 'i',
                                props: {
                                    'class': 'glyphicon glyphicon-search'
                                }
                            }
                        ]
                    }
                },
                {
                    props: {
                        'class': ['result-container is-expand', '{#model.isResultListExpand,converter=boolean}'],
                        style: {
                            'max-height': '{#model.resultContainerHeight}'
                        }
                    },
                    content: [
                        {
                            type: 'odl.views.NodeInterfaceListView',
                            props: {
                                containerClass: 'search-result',
                                list: '{#model.searchResultList}'
                            },
                            events:{
                                listScroll:'{#model.onSearchResultListScroll}'
                            }
                        },
                        {
                            props: {
                                'class': ['search-result-action']
                            },
                            content: {
                                tag: 'a',
                                props: {
                                    'class': 'btn btn-link'
                                },
                                content: 'add to selection list',
                                events: {
                                    click: '{#model._addToWatch}'
                                }
                            }
                        }
                    ]
                },//watch List
                {
                    props: {
                        'class': ['watch-list is-disable', '{#model.watchList.count,converter=inverted}'],
                        content: [
                            {
                                props: {
                                    'class': 'watch-list-panel'
                                },
                                content: [

                                    {
                                        props: {
                                            'class': 'watch-list-info-container'
                                        },
                                        content: [
                                            {
                                                tag: 'i',
                                                props: {
                                                    'class': ['check-icon fa', '{#model.isAllWatchedInterfacesSelected,converter=selectIconClass}']
                                                }
                                            },
                                            {
                                                props: {
                                                    'class': 'watch-list-info',
                                                    html: "{#model.watchListInfo}"
                                                }//,
//                                                content: "{#model.watchListInfo}"
                                            }
                                        ],
                                        events: {
                                            click: '{#model._toggleSelectAllWatchedInterfaces}'
                                        }
                                    },
                                    {
                                        tag: 'i',
                                        props: {
                                            'class': ["slide-icon fa", "{#model.expandWatchList,converter=slideIconClass}"]
                                        },
                                        events: {
                                            click: '{#model._toggleExpandWatchList}'
                                        }
                                    }
                                ]
                            },{
                                props: {
                                    'class': 'watch-list-action'
                                },
                                content: [
                                    {
                                        tag: 'a',
                                        props: {
                                            'class': 'btn btn-link btn-xs'
                                        },
                                        events: {
                                            click: '{#model._clearWatchList}'
                                        },
                                        content: 'clear'
                                    },
                                    {
                                        tag: 'i',
                                        props: {
                                            'class': 'fa fa-trash-o'
                                        }
                                    }
                                ]
                            },
                            {
                                type: 'odl.views.NodeInterfaceListView',
                                props: {
                                    containerClass: ['watch-result', 'is-expand', '{#model.expandWatchList}'],
                                    list: '{#model.watchList}',
                                    selectable:'{#model.watchListSelectable}'
                                }//,
//                                    events: {
//                                        select: "{#model._onSelectWatchedInterface}"
//                                    }
                            }
                        ]
                    }
                },
                {
                    props: {
                        'class': ['watched-action-row is-visible-animation', '{#model.expandWatchList}']
                    },
                    content: [
                        {
                            props: {
                                'class': 'col-xs-6'
                            },
                            content: {
                                tag: 'button',
                                props: {
                                    'class': ['btn btn-success','{#model.selectedWatchedInterfaces.count,converter=disabledInverted}']
//                                    ,
//                                    style: 'margin-left:-1px;'
                                },
                                events:{
                                  click:'{#model._toAddAcl}'
                                },
                                content: 'Add ACL'
                            }
                        },
                        {
                            props: {
                                'class': 'col-xs-6 align-center'
                            },
                            content: {
                                tag: 'button',
                                props: {
                                    'class': ['btn pull-right btn-success','{#model.selectedWatchedInterfaces.count,converter=disabledInverted}']
                                },events:{
                                    click:'{#model._viewAcl}'
                                },
                                content: 'View ACL'
                            }
                        }
//                        ,
//                        {
//                            props: {
//                                'class': 'col-xs-4 align-right'
//                            },
//                            content: {
//                                tag: 'button',
//                                props: {
//                                    'class': ['btn btn-danger','{#model.selectedWatchedInterfaces.count,converter=disabledInverted}']
//                                },
//                                events:{
//                                    click:'{#model._deleteAcl}'
//                                },
//                                content: 'Delete'
//                            }
//                        }
                    ]
                }
            ]
        }
    });
})(nx);