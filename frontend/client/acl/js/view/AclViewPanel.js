(function (nx) {
    var getAceListTemplate = function (type) {
        type = type || "inbound";
        var listClass = type + '-ace-list';

        var aceListTemplate = {
            tag: 'ul',
            props: {
                'class': ["ace-list " + listClass, '{#model.editBoundType}'],
                template: {
                    tag: 'li',
                    props: {
                        'class': ['ace-item is-deleting', '{isDeleting}', '{isEdit,converter=isEditClassConverter}', '{isPure,converter=isPureClassConverter}'],
                        states: {
                            enter: {
                                opacity: 0
                            }
                        }
                    },
                    content: [
                        {
                            props: {
                                'class': ['ace-info is-edit', '{isEdit}', "{editingData.editType}", '{isPure,converter=isPureClassConverter}']
                            },
                            content: [
                                {
                                    tag: 'span',
                                    props: {
                                        'class': 'sequence-number'
                                    },
                                    content: '{sequence-number}.'
                                },
                                {
                                    tag: 'span',
                                    props: {
                                        'class': ['grant', '{grant}']
                                    },
                                    content: '{grant}'
                                },
                                {
                                    tag: 'span',
                                    props: {
                                        'class': 'protocol'
                                    },
                                    content: '{protocolStr}'
                                },
                                {
                                    tag: 'span',
                                    props: {
                                        'class': 'source-ip',
                                        html: '{sourceIpStr}'
                                    }
                                },
                                {
                                    tag: 'span',
                                    props: {
                                        'class': 'dest-ip',
                                        html: '{destIpStr}'
                                    }
                                }
                            ]
                        },
                        {
                            props: {
                                'class': 'edit-icons'
                            },
                            content: [
                                {
                                    tag: 'i',
                                    props: {
                                        'class': 'fa fa-plus-circle'
                                    },
                                    events: {
                                        click: '{#model._toAddAce}'
                                    }
                                },
                                {
                                    tag: 'i',
                                    props: {
                                        'class': 'fa fa-edit'
                                    },
                                    events: {
                                        click: '{#model._toEditAce}'
                                    }
                                },
                                {
                                    tag: 'i',
                                    props: {
                                        'class': 'fa fa-trash-o'
                                    },
                                    events: {
                                        click: '{#model._deleteAce}'
                                    }
                                }
                            ]
                        },
                        {
                            props: {
                                'class': ['ace-item-edit is-edit', '{isEdit}', '{itemClass}'],
                                protocol: '{editingData.protocol}',
                                items:'{editingDataList}',
                                template: [
                                        {
                                            content: [
                                                {
                                                    tag: 'span',
                                                    props: {
                                                        'class': 'edit-ace-label'
                                                    },
                                                    content: [
                                                        {
                                                            tag: 'span',
                                                            content: '{editType}'
                                                        },
                                                        {
                                                            tag: 'span',
                                                            content: ' ACE'
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            tag: 'span',
                                            props: {
                                                'class': ['show-sequence-number', '{editType}']
                                            },
                                            content: '{sequence-number}'
                                        },
                                        {
                                            tag: 'span',
                                            'props': {
                                                'class': ['edit-sequence-number', '{editType}']
                                            },
                                            content: {
                                                tag: 'input',
                                                props: {
                                                    type: 'number',
                                                    value: '{sequence-number}',
                                                    min: '1',
                                                    placeholder: 'seq#'
                                                }
                                            }
                                        },
                                        {
                                            tag: 'select',
                                            props: {
                                                'class': ['grant', '{grant}'],
                                                value: '{grant}',
                                                template: {
                                                    tag: 'option',
                                                    content: "{}"
                                                },
                                                items: ['deny', 'permit']
                                            }
                                        },
                                        {
                                            tag: 'i',
                                            props: {
                                                'class': 'fa fa-caret-down'
                                            }
                                        },
                                        {
                                            tag: 'select',
                                            props: {
                                                'class': 'protocol',
                                                value: '{protocol}',
                                                template: {
                                                    tag: 'option',
                                                    props: {
                                                        value: '{value}'
                                                    },
                                                    content: "{text}"
                                                },
                                                items: [
                                                    {text: 'tcp', value: 6},
                                                    {text: 'icmp', value: 1},
                                                    {text: 'udp', value: 17},
                                                    {text: 'sctp', value: 132},
                                                    {text: "ip", value: ''}
                                                ]
                                            }
                                        },
                                        {
                                            tag: 'i',
                                            props: {
                                                'class': 'fa fa-caret-down'
                                            }
                                        },
                                        getAceEditIPTemplate('source'),
                                        getAceEditIPTemplate('destination'),
                                        {
                                            tag: 'span',
                                            props: {
                                                'class': 'edit-actions'
                                            },
                                            content: [
                                                {
                                                    tag: 'a',
                                                    props: {
                                                        'class': 'action-link'
                                                    },
                                                    events: {
                                                        click: '{#model._saveEditAce}'
                                                    },
                                                    content: 'Save'
                                                },
                                                {
                                                    tag: 'a',
                                                    props: {
                                                        'class': 'action-link'
                                                    },
                                                    events: {
                                                        click: '{#model._cancelEditAce}'
                                                    },
                                                    content: 'Cancel'
                                                }
                                            ]
                                        }
                                    ]
                            }
                        }
                    ]
                },
                items: "{#model.selected" + (type.charAt(0).toUpperCase() + type.slice(1)) + "AceList}"
            }
        }

        return aceListTemplate;
    };

    var getAceEditIPTemplate = function (type) {
        var lastInputEvents = {};
        if (type == 'destination') {
            lastInputEvents.blur = '{#model.editAceLastInputBlur}';
        }

        var template = {
            tag: 'span',
            props: {
                'class': 'ip-inputs ' + type
            },
            content: [
                {
                    tag: 'input',
                    props: {
                        'class': 'ip-input',
                        placeholder: 'Address',
                        value: "{" + type + "-network.address}"
                    }
                },
                {
                    tag: 'input',
                    props: {
                        'class': 'wcb-input',
                        placeholder: 'Wildcard',
                        value: "{" + type + "-network.wild-card-bits}"
                    },
                    events: lastInputEvents
                },
                {
                    name: 'edit-port',
                    tag: 'span',
                    props: {
                        'class': ['edit-port', "{" + type + "-port.port-mode}"]
                    },
                    content: [
                        {
                            tag: 'select',
                            props: {
                                value: "{" + type + "-port.port-mode}",
                                'tabIndex': '{editPortTabIdx}',
                                template: {
                                    tag: 'option',
                                    props: {
                                        value: '{value}'
                                    },
                                    content: "{text}"
                                },
                                items: [
                                    {text: "equal", value: 'equal'},
                                    {text: 'range', value: 'range'},
                                    {text: 'lt', value: 'less-than'},
                                    {text: 'neq', value: 'not-equal'},
                                    {text: 'gt', value: 'greater-than'}
                                ]
                            }
                        },
                        {
                            tag: 'i',
                            props: {
                                'class': 'fa fa-caret-down'
                            }
                        },
                        {
                            tag: 'input',
                            props: {
                                'class': 'port',
                                placeholder: 'Port',
                                'tabIndex': '{editPortTabIdx}',
                                value: "{" + type + "-port.first-port}"
                            },
                            events: lastInputEvents
                        },
                        {
                            name: 'port2',
                            tag: 'input',
                            props: {
                                'class': 'port port2',
                                placeholder: 'Port',
                                'tabIndex': '{edit' + (type.charAt(0).toUpperCase() + type.substr(1)) + 'Port2TabIdx}',
                                value: "{" + type + "-port.second-port}"
                            },
                            events: lastInputEvents
                        }
                    ]
                }
            ]
        };

        return template;
    }
    nx.extend(nx.Binding.converters, {
        emptyAclNameConverter: {
            convert: function (value) {
                if (!value) {
                    return "......";
                }
                return value;
            }
        },
        isEditClassConverter: {
            convert: function (value) {
                return "is-edit-" + !!value;
            }
        },
        isPureClassConverter: {
            convert: function (value) {
                return 'is-pure-' + !!value;
            }
        }
    });
    nx.define('old.acl.views.AclViewPanel', nx.ui.Component, {
        properties: {
            isListSlideDown: false
        },
        view: {
            props: {
                'class': 'acl-view'
            },
            content: [
                {
                    props: {
                        'class': 'acl-watch-info'
                    },
                    content: [
                        {
                            content: [
                                {
                                    tag: 'input',
                                    props: {
                                        type: 'checkbox',
                                        checked: '{#model.isBatchCheck,direction=<>}'
                                    }
                                },
                                {
                                    content: "select all interfaces to do batch operation"
                                }
                            ]
                        }
                    ]
                },
                {
                    props: {
                        'class': ['acl-main-view edit-mode', '{#model.editMode}']
                    },
                    content: [
                        {
                            props: {
                                'class': ['main-left edit-mode', '{#model.editMode}']
                            },
                            content: [
                                {
                                    props: {
                                        'class': ['device-interface-info is-slide', '{#isListSlideDown}']
                                    },
                                    content: [
                                        {
                                            props: {
                                                'class': 'device-info'
                                            },
                                            content: [
                                                {
                                                    props: {
                                                        'class': 'icon-nav'
                                                    },
                                                    content: [
                                                        {
                                                            tag: 'i',
                                                            props: {
                                                                'class': 'n-icon-router logo'
                                                            }
                                                        },
                                                        {
                                                            tag: 'span',
                                                            props: {
                                                                'class': 'nav-title'
                                                            },
                                                            content: 'Device'
                                                        },
                                                        {
                                                            tag: 'i',
                                                            props: {
                                                                'class': 'fa fa-chevron-right arrow'
                                                            }
                                                        }
                                                    ]
                                                },
                                                {
                                                    props: {
                                                        'class': 'device-list'
                                                    },
                                                    content: {
                                                        tag: 'ul',
                                                        props: {
                                                            template: {
                                                                tag: 'li',
                                                                props: {
                                                                    'class': ['device-item is-selected', '{value.selectedForAcl}']
                                                                },
                                                                events: {
                                                                    click: '{#model._onSelectDevice}'
                                                                },
                                                                content: [
                                                                    {
                                                                        tag: 'span',
                                                                        props: {
                                                                            'class': 'list-name'
                                                                        },
                                                                        content: "{key}"
                                                                    },
                                                                    {
                                                                        tag: 'span',
                                                                        props: {
                                                                            'class': 'list-ip'
                                                                        },
                                                                        content: '{value.node.ip}'
                                                                    },
                                                                    {
                                                                        tag: 'i',
                                                                        props: {
                                                                            'class': 'fa fa-caret-right'
                                                                        }
                                                                    }
                                                                ]
                                                            },
                                                            items: "{#model.selectedWatchedInterfaces}"
                                                        }
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            props: {
                                                'class': 'interface-info'
                                            },
                                            content: [
                                                {
                                                    props: {
                                                        'class': 'icon-nav'
                                                    },
                                                    content: [
                                                        {
                                                            tag: 'i',
                                                            props: {
                                                                'class': 'n-icon-interface logo'
                                                            }
                                                        },
                                                        {
                                                            tag: 'span',
                                                            props: {
                                                                'class': 'nav-title'
                                                            },
                                                            content: 'Interface'
                                                        },
                                                        {
                                                            tag: 'i',
                                                            props: {
                                                                'class': 'fa fa-chevron-right arrow'
                                                            }
                                                        }
                                                    ]
                                                },
                                                {
                                                    props: {
                                                        'class': 'interface-list'
                                                    },
                                                    content: {
                                                        tag: 'ul',
                                                        props: {
                                                            template: {
                                                                tag: 'li',
                                                                props: {
                                                                    'class': ['interface-item is-selected', '{selectedForAcl}'],
                                                                    states: {
                                                                        enter: {
                                                                            opacity: 0
                                                                        }
                                                                    }
                                                                },
                                                                events: {
                                                                    click: '{#model._onSelectAclInterface}'
                                                                },
                                                                content: [
                                                                    {
                                                                        tag: 'span',
                                                                        props: {
                                                                            'class': 'list-name'
                                                                        },
                                                                        content: "{name}"
                                                                    },
                                                                    {
                                                                        tag: 'i',
                                                                        props: {
                                                                            'class': 'fa fa-caret-right'
                                                                        }
                                                                    }
                                                                ]
                                                            },
                                                            items: "{#model.selectedDeviceForAcl}"
                                                        }
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            props: {
                                                'class': 'slide-arrow'
                                            },
                                            events: {
                                                click: function () {
                                                    this.isListSlideDown(!this.isListSlideDown());
                                                }
                                            },
                                            content: {
                                                props: {
                                                    'class': 'inner-arrow'
                                                }
                                            }
                                        }
                                    ]
                                },
                                {
                                    name: 'acl-topo-container',
                                    props: {
                                        'class': 'acl-topo-container'
                                    },
                                    content: {
                                        name: 'topology-container',
                                        props: {
                                            "class": 'topology-container'
//                        states:{
//                            enter:{
//                                opacity:0,
//                                border:'1px solid red',
//                                duration:3000
//                            }
//                        }
                                        },
                                        content: [
                                            {
//                                        tag:'span',
                                                props: {
                                                    'class': 'back-to-search'
                                                },
                                                events: {
                                                    click: '{#model._backToSearch}'
                                                },
                                                content: [
                                                    {
                                                        tag: 'i',
                                                        props: {
                                                            'class': 'fa fa-arrow-left'
                                                        }
                                                    },
                                                    {
                                                        tag: 'span',
                                                        content: 'Back to full map view'
                                                    }
                                                ]
                                            },
                                            {
                                                name: 'topo',
                                                type: 'nx.graphic.Topology',
                                                props: {
                                                    adaptive: true,
                                                    showIcon: true,
                                                    showNavigation: false,
                                                    nodeConfig: {
                                                        label: 'model.name',
                                                        iconType: 'router'
                                                    },
                                                    identityKey: 'id',
                                                    theme: 'blue',
                                                    autoLayout: true,
                                                    data: "{#model.topoData}",
                                                    layoutType: 'USMap',
                                                    layoutConfig: {
                                                        longitude: 'model.longitude',
                                                        latitude: 'model.latitude'
                                                    },
                                                    tooltipManagerConfig: {
                                                        nodeTooltipContentClass: 'odl.acl.TooltipView'
                                                    }
                                                },
                                                events: {
                                                    clickStage: "{#model._clickTopo}"
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        },
                        {
                            props: {
                                'class': ['main-right is-busy', '{#model.enableBound}', '{#model.isBusy}']
                            },
                            content: [
                                {
                                    props: {
                                        'class': 'acl-info'
                                    },
                                    content: [
                                        {
                                            props: {
                                                'class': 'icon-nav'
                                            },
                                            content: [
                                                {
                                                    tag: 'i',
                                                    props: {
                                                        'class': 'n-icon-acl logo'
                                                    }
                                                },
                                                {
                                                    tag: 'span',
                                                    props: {
                                                        'class': 'nav-title'
                                                    },
                                                    content: 'ACL'
                                                }
                                            ]
                                        },
                                        {
                                            props: {
                                                'class': ['nav-tab is-inbound', '{#model.editBoundType}']
                                            },
                                            events: {
                                                click: '{#model._setEditBoundType}'
                                            },
                                            content: [
                                                {
                                                    tag: 'span',
                                                    content: 'Inbound '
                                                },
                                                {
                                                    tag: 'span',
                                                    content: '{#model.selectedAcl.inbound.acl-name,converter=emptyAclNameConverter}'
                                                }
                                            ]
                                        },
                                        {
                                            props: {
                                                'class': ['nav-tab is-outbound', '{#model.editBoundType}']
                                            },
                                            events: {
                                                click: '{#model._setEditBoundType}'
                                            },
                                            content: [
                                                {
                                                    tag: 'span',
                                                    content: 'Outbound '
                                                },
                                                {
                                                    tag: 'span',
                                                    content: '{#model.selectedAcl.outbound.acl-name,converter=emptyAclNameConverter}'
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    props: {
                                        'class': ['acl-list-view', '{#model.editTemplateMode}']
                                    },
                                    content: [
                                        {
                                            props: {
                                                'class': 'acl-list'
                                            },
                                            content: [
                                                getAceListTemplate('inbound'),
                                                getAceListTemplate('outbound')
                                            ]
                                        },
                                        {
                                            props: {
                                                'class': 'acl-template'
                                            },
                                            content: [
                                                {
                                                    props: {
                                                        'class': 'new-from-blank'
                                                    },
                                                    events: {
                                                        click: '{#model._toAddTemplateAcl}'
                                                    },
                                                    content: [
                                                        {
                                                            tag: 'a',
                                                            content: "New from blank ACL"
                                                        }
                                                    ]
                                                },
                                                {
                                                    props: {
                                                        'class': 'new-from-template'
                                                    },
                                                    content: [
                                                        {
                                                            props: {
                                                                'class': 'title'
                                                            },
                                                            content: "New from template"
                                                        },
                                                        {
                                                            props: {
                                                                'class': 'note'
                                                            },
                                                            content: 'Choose your template'
                                                        },
                                                        {
                                                            props: {
                                                                'class': 'template-list',
                                                                template: {
                                                                    props: {
                                                                        'class': 'template-item'
                                                                    },
                                                                    events: {
                                                                        click: '{#model._toAddTemplateAcl}'
                                                                    },
                                                                    content: '{name}'
                                                                },
                                                                items: '{#model.aclTemplateList}'
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            props: {
                                                'class': 'acl-list-action'
                                            },
                                            content: [
                                                {
                                                    tag: 'button',
                                                    props: {
                                                        'class': 'btn btn-sm btn-success',
                                                        'style': 'display: none'
                                                    },
                                                    content: [
                                                        {
                                                            tag: 'i',
                                                            props: {
                                                                'class': "fa fa-bug"
                                                            }
                                                        },
                                                        {
                                                            tag: 'span',
                                                            content: "Validate"
                                                        }
                                                    ]
                                                },
                                                {
                                                    tag: 'button',
                                                    props: {
                                                        'class': 'btn btn-sm btn-info for-view'
                                                    },
                                                    content: [
                                                        {
                                                            tag: 'i',
                                                            props: {
                                                                'class': "fa fa-check-circle-o"
                                                            }
                                                        },
                                                        {
                                                            tag: 'span',
                                                            events: {
                                                                click: '{#model.deployAcl}'
                                                            },
                                                            content: 'Deploy'
                                                        }
                                                    ]
                                                },
                                                {
                                                    tag: 'button',
                                                    props: {
                                                        'class': 'btn btn-sm btn-danger for-view'
                                                    },
                                                    content: [
                                                        {
                                                            tag: 'i',
                                                            props: {
                                                                'class': "fa fa-check-circle-o"
                                                            }
                                                        },
                                                        {
                                                            tag: 'span',
                                                            events: {
                                                                click: '{#model._deleteAcl}'
                                                            },
                                                            content: 'Delete'
                                                        }
                                                    ]
                                                },
                                                {
                                                    tag: 'button',
                                                    props: {
                                                        'class': 'btn btn-sm btn-info for-add'
                                                    },
                                                    content: [
                                                        {
                                                            tag: 'i',
                                                            props: {
                                                                'class': "fa fa-download"
                                                            }
                                                        },
                                                        {
                                                            tag: 'span',
                                                            events: {
                                                                click: '{#model.deployInbound}'
                                                            },
                                                            content: 'Deploy Inbound'
                                                        }
                                                    ]
                                                },
                                                {
                                                    tag: 'button',
                                                    props: {
                                                        'class': 'btn btn-sm btn-info for-add'
                                                    },
                                                    content: [
                                                        {
                                                            tag: 'i',
                                                            props: {
                                                                'class': "fa fa-upload"
                                                            }
                                                        },
                                                        {
                                                            tag: 'span',
                                                            events: {
                                                                click: '{#model.deployOutbound}'
                                                            },
                                                            content: 'Deploy Outbound'
                                                        }
                                                    ]
                                                },
                                                {
                                                    tag: 'button',
                                                    props: {
                                                        'class': 'btn btn-sm btn-danger for-add'
                                                    },
                                                    content: [
                                                        {
                                                            tag: 'i',
                                                            props: {
                                                                'class': "fa fa-times-circle-o"
                                                            }
                                                        },
                                                        {
                                                            tag: 'span',
                                                            events: {
                                                                click: '{#model.cancelEditByTemplate}'
                                                            },
                                                            content: 'Discard'
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            props: {
                                                'class': 'no-acl'
                                            },
                                            content: 'No ACL on this interface'
                                        },
                                        {
                                            props: {
                                                'class': ['loading-overlay is-visible', '{#model.isBusy}']
                                            },
                                            content: {
                                                props: {
                                                    'class': 'overlay-content',
                                                    html: '{#model.message}'
                                                }
//                                                ,
//                                                content: [
//                                                    {
//                                                        tag: 'i',
//                                                        props: {
//                                                            'class': 'fa fa-spin fa-spinner'
//                                                        }
//                                                    },
//                                                    {
//                                                        tag: 'span',
//                                                        content: '{#model.message}'
//                                                    }
//                                                ]
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    });
})(nx);