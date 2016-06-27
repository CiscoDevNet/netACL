(function (nx) {
    nx.define('odl.acl.views.MainView', nx.ui.Component, {
        view: {
            props: {
                'class': 'acl-main',
                states: {
                    enter: {
                        duration: 1000,
                        opacity: 0
                    }
                }
            },
            content: [
                {
                    name: 'searchContainer',
                    props: {
                        'class': ['search-container','{#model.viewMode}'],
                        content:{
                            name:'search-panel',
                            type:'odl.acl.views.searchPanelView'
                        }
                    }
                },{
                    props:{
                        'class':['acl-view-container','{#model.viewMode}']
                    },
                    content:{
                        name:'acl-view-panel',
                        type:'old.acl.views.AclViewPanel',
                        props:{
                            isListSlideDown:'{#model.isDeviceSlideDown,direction=<>}'
                        }
                    }
                }, {
                    name: 'terminalContainer',
                    props: {
                        'class': ['terminal-container','{#model.viewMode}'],
                        template: {
                            type: 'odl.TerminalWindow',
                            props: {
                                maximized: "{value.maximized,direction=<>}",
                                opened: "{value.opened}",
                                address: "{value.address}",
                                port: "{value.port}",
                                title: '{value.title}',
                                service:'{value.service}'
                            },
                            events: {
                                close: "{value.onClose}"
                            }
                        },
                        items: "{#model.terminalWindows}"
                    }
                },{
                    props:{
                        'class':['deploy-modal is-visible','{#model.isDeployModalShow,converter=boolean}']
                    },
                    content:{
                        props:{
                            'class':'modal-wrapper'
                        },
                        content:[{
                            props:{
                                'class':'title'
                            },
                            content:'Deploy new ACL'
                        },{
                            props:{
                                'class':'body'
                            },
                            content:[{
                                props:{
                                    'class':'content'
                                },
                                content:[{
                                    tag:'span',
                                    content:'A new ACL '
                                },{
                                    name:'new_acl_name',
                                    tag:'input',
                                    props:{
                                        'class':'',
                                        value:"{#model.selectedAcl.inbound.acl-name}",
                                        placeholder:'input acl name here'
                                    }
                                },{
                                    tag:'span',
                                    content:' will be deployed to the device(s).'
                                }]
                            },{
                                props:{
                                    'class':'action-bar'
                                },
                                content:[{
                                    tag:'a',
                                    props:{
                                        'class':'confirm'
                                    },
                                    events:{
                                        click:"{#model.confirmDeploy}"
                                    },
                                    content:'Confirm'
                                },{
                                    tag:'a',
                                    props:{
                                        'class':'cancel'
                                    },
                                    events:{
                                        click:'{#model._cancelDeployModal}'
                                    },
                                    content:'Cancel'
                                }]
                            }]
                        }]
                    }
                }
            ]
        }
    });
})(nx);