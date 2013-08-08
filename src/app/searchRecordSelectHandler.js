// Handler called when:
// - a record is selected in the search drop down list
// - a property number is passed in the URL and has returned a valid property record

searchRecordSelectHandler = function(combo, record, app, JSONconf, northPart, eastPanel) {
    if (record.data === undefined) { return; }

    // Smart title case on selected item
    var curr_val = Ext.get('gtSearchCombobox').getValue();
    if (curr_val)
    {
        Ext.getCmp('gtSearchCombobox').setValue(helpers.toSmartTitleCase(curr_val));
    }

    // Now doing a call to the restful geof endpoint, based on the information in the selected record
    var url_object = JSONconf.searchEndPoints.basemap.details + record.data.gsln + "/" + record.data.idcol +  "/is/" + encodeURIComponent(record.data.idval);

    Ext.Ajax.request({
        method: "GET",
        url: url_object,
        params: {},
        callback: function(options, success, response) {
            var status = response.status;
            if (status >= 200 && status < 403 && response.responseText) {
                // We then feed the object returned into the highlight layer
                var geojson_format = new OpenLayers.Format.GeoJSON({
                    'internalProjection': new OpenLayers.Projection("EPSG:900913"),
                    'externalProjection': new OpenLayers.Projection("EPSG:4326")
                });
                var geojson = geojson_format.read(response.responseText);

                // Setting the flag, label and types for feature details display in panel
                if (! (JSONconf.hideSelectedFeaturePanel)) {
                    northPart.setHeight(60);
                    Ext.getCmp('gtInfoCombobox').setVisible(true);
                    // Collapsing the drop-down
                    Ext.getCmp('gtInfoCombobox').collapse();
                }
                eastPanel.expand();
                app.getSelectionLayer().extraVars = {
                    WFS: true,
                    layerName : record.data.gsln,
                    featureType : record.data.ld,
                    featureLabel : record.data.label
                };

                // Managing objects in the selection layer
                app.getSelectionLayer().removeAllFeatures();
                app.getSelectionLayer().addFeatures(geojson);

                // Calculating the overall envelope of all objects returned
                var envelope = geojson[0].geometry.getBounds();
                for (var i=1;i<geojson.length;i++)
                {
                    envelope.extend(geojson[i].geometry.getBounds());
                }

                // Zooming to the envelope
                var z = app.mapPanel.map.getZoomForExtent(envelope);
                if (z < JSONconf.zoomMax) {
                    app.mapPanel.map.zoomToExtent(envelope);
                } else {
                    // If zooming too close, taking step back to level JSONconf.zoomMax , centered on the center of the bounding box for this record
                    app.mapPanel.map.moveTo(new OpenLayers.LonLat((envelope.left + envelope.right) / 2, (envelope.top + envelope.bottom) / 2), JSONconf.zoomMax);
                }

            }
        }
    });
};

