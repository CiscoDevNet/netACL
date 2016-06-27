(function (nx) {
    nx.define('odl.views.NodeInterfaceListView', nx.ui.Component, {
        events: ['select','listScroll'],
        properties: {
            containerClass: '',
            list: null,
            selectable:true
        },
        view: {
            props: {
                'class': "{#containerClass}"
            },
            events:{
                scroll:'{#listScroll}'
            },
            content: [
                {
                    tag: 'ul',
                    props: {
                        'class': 'result-list',
                        template: [
                            {
                                tag: 'li',
                                props: {
//                                    states: {
//                                        enter: {
//                                            opacity: 0,
//                                            duration: 1900
//                                        }
//                                    }
                                },
                                content: [
                                    {
                                        tag: 'div',
                                        props: {
                                            'class': 'inline-block node-info'
                                        },
                                        content: [
                                            {
                                                tag: 'i',
                                                props: {
                                                    'class': ['fa', '{value.isAllSelected,converter=selectIconClass}']
                                                }
                                            },
                                            {
                                                tag: 'i',
                                                props: {
                                                    'class': ''
                                                }
                                            },
                                            {
                                                tag: 'span',
                                                content: "{key}"
                                            }
                                        ],
                                        events: {
                                            click: '{#_selectAll}'
                                        }
                                    },
                                    {
                                        tag: 'span',
                                        props: {
                                            'class': 'ip'
                                        },
                                        content: '{value.node.ip}'
                                    },
                                    {
                                        tag: 'i',
                                        props: {
                                            'class': ["slide-icon fa", "{value.expand,converter=slideIconClass}"]
                                        },
                                        events: {
                                            click: "{#_toggleExpand}"
                                        }
                                    }
                                ]
                            },
                            {
                                tag: 'ul',
                                props: {
                                    'class': ['interface-list is-expand', '{value.expand}'],
//                                    states: {
//                                        enter: {
//                                            opacity: 0,
//                                            duration: 1900
//                                        },
//                                        leave: {
//                                            opacity: 0,
//                                            duration: 1900
//                                        }
//                                    },
                                    template: {
                                        tag: 'li',
                                        props: {

                                        },
                                        content: [
                                            {
                                                props: {
                                                    'class': 'interface-info inline-block'
                                                },
                                                content: [
                                                    {
                                                        tag: 'i',
                                                        props: {
                                                            'class': ['fa', '{selected,converter=selectIconClass}']
                                                        }
                                                    },
                                                    {
                                                        tag: 'span',
                                                        content: "{name}"
                                                    }
                                                ],
                                                events: {
                                                    click: '{#_selectInterface}'
                                                }
                                            },
                                            {
                                                tag: 'span',
                                                props: {
                                                    'class': 'ip'
                                                },
                                                content: "{address}"
                                            }
                                        ]
                                    },
                                    items: "{value}"
                                }
                            }
                        ],
                        items: "{#list}"
                    }
                }
            ]
        },
        methods: {
            _toggleExpand: function (sender) {
                var model = sender.model().value();
                var expand = model.expand();
                model.expand(!expand);
            },
            _selectAll:function(sender){
                if(!this.selectable())return;
                var model = sender.model();
                var col = model.value();
                col.selectAll.call(col,sender);
            },
            _selectInterface: function (sender) {
                if(!this.selectable())return;
                var interfaceObj = sender.model();
                var selected = interfaceObj.get('selected');
                interfaceObj.set('selected', !selected);
                this.fire('select');
            },
            listScroll:function(sender,event){
                this.fire('listScroll');
            }
        }
    })

})(nx);