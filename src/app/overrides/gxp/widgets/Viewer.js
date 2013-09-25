/* This override allows correct behavior of transparency of aerial images */
/* Overlays are still visible on top of the aerial imagery basemap */
gxp.Viewer.prototype.addLayers = function() {
    var mapConfig = this.initialConfig.map;
    if(mapConfig && mapConfig.layers) {
        var conf, source, record, baseRecords = [], overlayRecords = [];
        for (var i=0; i<mapConfig.layers.length; ++i) {
            conf = mapConfig.layers[i];
            source = this.layerSources[conf.source];
            // source may not have loaded properly (failure handled elsewhere)
            if (source) {
                record = source.createLayerRecord(conf);
                if (record) {
                    /* This is where the magic happens: background and aerial groups layers are added as basemap */
                    if (record.get("group") === "background" || record.get("group") === "aerial") {
                        baseRecords.push(record);
                    } else {
                        overlayRecords.push(record);
                    }
                }
            }
        }
        
        // sort background records so visible layers are first
        // this is largely a workaround for an OpenLayers Google Layer issue
        // http://trac.openlayers.org/ticket/2661
        baseRecords.sort(function(a, b) {
            // sort function is supposed to return -1, 0 or 1
            // http://stackoverflow.com/questions/5428236/javascript-sort-not-working-with-ie9
            if (typeof a.get === 'function')
            {
                if (a.get("group") > b.get("group"))
                {
                    return -1;
                }
                if (a.get("group") < b.get("group"))
                {
                    return 1;
                }
            }
            return 0;
        });
        
        var panel = this.mapPanel;
        var map = panel.map;
        
        var records = baseRecords.concat(overlayRecords);
        if (records.length) {
            panel.layers.add(records);
        }
        
    }        
};