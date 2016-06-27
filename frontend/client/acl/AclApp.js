(function (nx) {
    var App = nx.define(nx.ui.Application, {
        methods: {
            start: function (options) {
                var view = new odl.acl.views.MainView();
                var topo = view.view('acl-view-panel').resolve('topo');
                vm = new odl.acl.viewmodels.MainViewModel();
                vm.topo(topo);
                vm._mainView = view;

                view.model(vm);

                this.on('resize', function () {
                    console.log('resizing....',getComputedStyle(document.body)['overflow']);
                    topo.adaptToContainer();
                });

                view.attach(this);

                setTimeout(function () {
                    view.view("search-panel").view("searchInput").dom().focus();
                }, 1000);
            }
        }
    });

    function pathJoin(protocol, parts) {
        var separator = '/';
        var replace   = new RegExp(separator+'{1,}', 'g');
        var connectedPath = parts.join(separator).replace(replace, separator);
        if (protocol) {
            return protocol + "://" + connectedPath;
        }
        else {
            return connectedPath;
        }
    }

    var appName = 'acl';

    var host = location.host;

    console.log("Host: " + host);

    var wsProtocol = 'ws';
    var httpProtocol = 'http';

    var backendPath = pathJoin(null, ['/pathman/topology', appName]);
    var websPath = pathJoin(null, [host, '/APP/webs', appName]);
    var topoUrl = location.protocol + '//' + pathJoin(null, [host, backendPath]);
    //host = "10.75.161.96";
    console.log("TopoUrl: " + topoUrl);

    odl.acl.Config = new nx.Config({
        topoDataUrl: topoUrl,
//        topoDataUrl: "http://" + host + "/APP/webs/rest/topo",
        updateInterfaceUrl: pathJoin(httpProtocol, [websPath, "rest/topo/node/{nodeid}/interface"]),
        socketUrl: pathJoin(wsProtocol, [websPath, '/sock/tc']),
//        getAclUrl: './js/model/acl.json',
        getAclUrl: pathJoin(httpProtocol, [websPath, 'rest/topo/node/{nodeName}/acl?if={intfName}']),
        getAclTemplateUrl: './js/model/template.json',
        modifyAclUrl: pathJoin(httpProtocol, [websPath, 'rest/topo/node/{nodeName}/acl']),
        addAndUnbindAclUrl: pathJoin(httpProtocol, [websPath, 'rest/topo/acl'])
    });

    (new App()).start();
})(nx);