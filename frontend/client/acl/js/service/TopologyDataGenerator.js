/**
 * Created by xiaobshi on 14-5-16.
 */
var rand = {
    randfloat:function(start,end){
        return start + Math.random() * (end - start);
    },
    randint: function (start, end) {
        return start + Math.floor(Math.random() * (end - start));
    }
}
function TopologyDataGenerator(nodeCount, linkCount,layoutType) {
    var self = this;
    this.nodeCount = nodeCount;
    this.linkCount = linkCount;
    this.layoutType = layoutType;
    self.nodes = self.genNodes(nodeCount);
    self.links = self.genLinks(linkCount);
}

TopologyDataGenerator.prototype = {
    _genRandomIp: function () {
        var temp = [];
        for (var i = 0; i < 4; i++) {
            temp.push(rand.randint(0, 255)+'')
        }
        return temp.join('.');
    },

    _genRandomName: function (lenRange) {
        var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var name = '';
        lenRange = lenRange || [3, 8];
        var rand_len = rand.randint.apply(rand, lenRange);
        for (var i = 0; i < rand_len; i++) {
            name += chars[rand.randint(0, chars.length - 1)]
        }
        return name;
    },

    _genInterfaceName: function () {
        var type = rand.randint(1, 3)
        var name = '';
        if (type == 1) {
            var name = 'GigabitEthernet'
            var slashCount = rand.randint(1, 4)
            for (var i = 0; i < slashCount; i++) {
                if (i > 0)name += '/';
                name += rand.randint(0, 5) + '';
            }
        } else if (type == 2) {
            name = 'Loopback';
            name += rand.randint(0, 12) + '';
        }

        return name;
    },

    _genInterfaces: function (count) {
        var interfaces = [];
        var self = this;
        for (var i = 0; i < count; i++) {
            var interfaceObj = {};
            interfaceObj.name = self._genInterfaceName();
            interfaceObj['address'] = self._genRandomIp();
            interfaceObj['description'] = self._genRandomName([0, 20]);
            var netmasks = ['255.255.0.0', '255.255.255.0', '255.255.0.255', '255.255.255.255'];
            interfaceObj['netmask'] = netmasks[rand.randint(0, netmasks.length - 1)]
            interfaces.push(interfaceObj)
        }
        return interfaces;
    },
    _genNode: function (id) {
        var node = {}, self = this;
        node['id'] = "node" + id;
        node['name'] = self._genRandomName();
        node['ip'] = self._genRandomIp();
        node['interface'] = self._genInterfaces(rand.randint(5, 15));
        var mapData = self._genMapData(this.layoutType);
        node['latitude'] = mapData.latitude;
        node['longitude'] = mapData.longitude;
        return node;
    },
    _genMapData:function(type){
        type = type ||'USMap';
        var range_latitude = [-180,180];
        var range_longitude = [-180,180];
        switch(type){
            case 'USMap':
                range_latitude = [25.7743,47.6062];
                range_longitude = [-122.676,-71.0598];
                break;
        }
        var rand_latitude = rand.randfloat.apply(rand,range_latitude);
        var rand_longitude = rand.randfloat.apply(rand,range_longitude);
        return {latitude:rand_latitude,longitude:rand_longitude};
    },
    genNodes: function (count) {
        var nodes = [], self = this;
        for (var i = 0; i < count; i++) {
            var node = self._genNode(i);
            nodes.push(node);
        }
        return nodes;
    },

    genLinks: function (count) {
        var self = this, nodes = self.nodes, node_len = nodes.length, links = [];
        for (var i = 0; i < count; i++) {
            var link = {};
            var source_index = rand.randint(0, node_len - 1);
            var rand_source = nodes[source_index];
            link['source'] = rand_source['id'];
            var target_index = rand.randint(0, node_len - 1);
            while (node_len > 1 && target_index == source_index) {
                target_index = rand.randint(0, node_len - 1);
            }
            var rand_target = nodes[target_index]
            link['target'] = rand_target['id']
            links.push(link);
        }
        return links
    },
    toTopoData: function () {
        return {nodes: this.nodes, links: this.links};
    }
}

//console.log('test...');
//var generator = new TopologyDataGenerator(10,9);
//console.log(generator.toTopoData())