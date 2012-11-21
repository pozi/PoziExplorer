// Handler called when:
// - a record is selected in the search drop down list
// - a property number is passed in the URL and has returned a valid property record

searchRecordSelectHandler = function(combo, record, app, JSONconf, northPart, eastPanel, gfromWFSFlag, gtyp, glab) {
    if (record.data === undefined) { return; }

    // Zooming to the relevant area (covering the selected record)
    var bd = new OpenLayers.Bounds(record.data.xmini, record.data.ymini, record.data.xmaxi, record.data.ymaxi).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
    var z = app.mapPanel.map.getZoomForExtent(bd);
    var fullWFSEndPoint = JSONconf.servicesHost + JSONconf.WFSEndPoint;

    if (z < JSONconf.zoomMax)
    {
        app.mapPanel.map.zoomToExtent(bd);
    }
    else
    {
        // If zooming too close, taking step back to level JSONconf.zoomMax , centered on the center of the bounding box for this record
        app.mapPanel.map.moveTo(new OpenLayers.LonLat((bd.left + bd.right) / 2, (bd.top + bd.bottom) / 2), JSONconf.zoomMax);
    }

    // Updating the WFS protocol to fetch this record
    app.getSelectionLayer().protocol = new OpenLayers.Protocol.WFS({
        version: "1.1.0",
        url: fullWFSEndPoint,
        featureType: record.data.gsln,
        srsName: JSONconf.WFSsrsName,
        featureNS: JSONconf.FeatureNS,
        geometryName: JSONconf.WFSgeometryName,
        schema: fullWFSEndPoint + "?service=WFS&version=1.1.0&request=DescribeFeatureType&TypeName=" + record.data.gsns + ":" + record.data.gsln
    });

    // Filtering the WFS layer on a column name and value - if the value contains a \, we escape it by doubling it
    app.getSelectionLayer().filter = new OpenLayers.Filter.Comparison({
        type: OpenLayers.Filter.Comparison.EQUAL_TO,
        property: record.data.idcol,
        value: record.data.idval.replace('\\', '\\\\')
    });

    // Refreshing the WFS layer so that the highlight appears and triggers the featuresadded event handler above
    app.getSelectionLayer().refresh({
        force: true
    });

    //
    if (! (JSONconf.hideSelectedFeaturePanel))
    {
        northPart.setHeight(60);
        Ext.getCmp('gtInfoCombobox').setVisible(true);
        // Collapsing the drop-down
        Ext.getCmp('gtInfoCombobox').collapse();
    }
    eastPanel.expand();

    gfromWFSFlag.value = "Y";
    gtyp.value = record.data.ld;
    glab.value = record.data.label;

};

