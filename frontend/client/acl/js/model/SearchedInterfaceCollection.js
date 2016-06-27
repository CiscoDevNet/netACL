/**
 * Created by xiaobshi on 14-3-14.
 */
(function(nx){
    nx.define('odl.acl.SearchedInterfaceCollection',nx.data.ObservableCollection,{
        properties: {
            isAllSelected: {
                get: function () {
                    var isAll = true;
                    this.each(function (intf) {
                        if (isAll && intf.get('selected')) {
                            isAll = false;
                            return false;
                        }
                    });
                    return isAll;
                }
            }
        }
    })
})(nx);