/**
 * APIMethod: read
 * Deserialize a XML string and return a DOM node.
 *
 * Parameters:
 * text - {String} A XML string
 
 * Returns:
 * {DOMElement} A DOM node
 */

/*
Reason for override:
- xmldom null in Firefox triggers an error 
(as per pull request https://github.com/openlayers/openlayers/pull/1210)
*/

OpenLayers.Format.XML.prototype.read = function(text) {
    var index = text.indexOf('<');
    if(index > 0) {
        text = text.substring(index);
    }
    var node = OpenLayers.Util.Try(
        OpenLayers.Function.bind((
            function() {
                var xmldom;
                /**
                 * Since we want to be able to call this method on the prototype
                 * itself, this.xmldom may not exist even if in IE.
                 */
                if(window.ActiveXObject && !this.xmldom) {
                    xmldom = new ActiveXObject("Microsoft.XMLDOM");
                } else {
                    xmldom = this.xmldom;   
                }
                if(!xmldom)
                {
                    throw "xmldom is null";
                }

                xmldom.loadXML(text);
                return xmldom;
            }
        ), this),
        function() {
            return new DOMParser().parseFromString(text, 'text/xml');
        },
        function() {
            var req = new XMLHttpRequest();
            req.open("GET", "data:" + "text/xml" +
                     ";charset=utf-8," + encodeURIComponent(text), false);
            if(req.overrideMimeType) {
                req.overrideMimeType("text/xml");
            }
            req.send(null);
            return req.responseXML;
        }
    );

    if(this.keepData) {
        this.data = node;
    }

    return node;
};