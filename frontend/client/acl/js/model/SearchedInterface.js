/**
 * Created by xiaobshi on 14-3-14.
 */
(function (nx) {
    nx.define('odl.acl.SearchedInterface', nx.data.ObservableObject, {
        properties:{
            selected:{
                set:function(value){
                    this._selected = value;
                }
            }
        }
    })
})(nx);