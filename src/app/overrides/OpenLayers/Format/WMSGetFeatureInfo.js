/* 

Reason for override: improper error handling makes IE11 sad.
Testing the 'data' object for existence before accessing its documentElement property makes it happy again.

 */
OpenLayers.Format.WMSGetFeatureInfo.prototype.read = function(data) {
    var result;
    if(typeof data == "string") {
        data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
    }
    var root;
    if(data) {
        root = data.documentElement;
    }
    if(root) {
        var scope = this;
        var read = this["read_" + root.nodeName];
        if(read) {
            result = read.call(this, root);
        } else {
            // fall-back to GML since this is a common output format for WMS
            // GetFeatureInfo responses
            result = new OpenLayers.Format.GML((this.options ? this.options : {})).read(data);
        }
    } else {
        result = data;
    }
    return result;
};
