// Override to provide the RULE parameter

GeoExt.WMSLegend.prototype.getLegendUrl = function(layerName, layerNames) {
    var rec = this.layerRecord;
    var url;
    var styles = rec && rec.get("styles");
    var layer = rec.getLayer();
    layerNames = layerNames || [layer.params.LAYERS].join(",").split(",");

    var styleNames = layer.params.STYLES &&
                         [layer.params.STYLES].join(",").split(",");
    var idx = layerNames.indexOf(layerName);
    var styleName = styleNames && styleNames[idx];
    // check if we have a legend URL in the record's
    // "styles" data field
    if(styles && styles.length > 0) {
        if(styleName) {
            Ext.each(styles, function(s) {
                url = (s.name == styleName && s.legend) && s.legend.href;
                return !url;
            });
        } else if(this.defaultStyleIsFirst === true && !styleNames &&
                  !layer.params.SLD && !layer.params.SLD_BODY) {
            url = styles[0].legend && styles[0].legend.href;
        }
    }
    if(!url) {
        url = layer.getFullRequestString({
            REQUEST: "GetLegendGraphic",
            WIDTH: null,
            HEIGHT: null,
            EXCEPTIONS: "application/vnd.ogc.se_xml",
            LAYER: layerName,
            LAYERS: null,
            STYLE: (styleName !== '') ? styleName: null,
            STYLES: null,
            SRS: null,
            FORMAT: null,
            TIME: null
        });
    }
    var params = Ext.apply({}, this.baseParams);
    if (layer.params._OLSALT) {
        // update legend after a forced layer redraw
        params._OLSALT = layer.params._OLSALT;
    }
    url = Ext.urlAppend(url, Ext.urlEncode(params));
    if (url.toLowerCase().indexOf("request=getlegendgraphic") != -1) {
        if (url.toLowerCase().indexOf("format=") == -1) {
            url = Ext.urlAppend(url, "FORMAT=image%2Fgif");
        }
        // add scale parameter - also if we have the url from the record's
        // styles data field and it is actually a GetLegendGraphic request.
        if (this.useScaleParameter === true) {
            var scale = layer.map.getScale();
            url = Ext.urlAppend(url, "SCALE=" + scale);
        }
        if (rec.json["rule"]) {
            url = Ext.urlAppend(url, "RULE=" + rec.json["rule"]);
        }
        if (rec.json["env"]) {
            url = Ext.urlAppend(url, "ENV=" + encodeURIComponent(rec.json["env"]));
        }
    }
    
    return url;
}