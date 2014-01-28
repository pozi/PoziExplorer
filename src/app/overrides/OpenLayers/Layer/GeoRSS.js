/*
Reason for override: not using popups to display information anymore.
Instead, pushing the data into the combobox.
*/

OpenLayers.Layer.GeoRSS.prototype.markerClick = function(evt) {
    var clickedFeature = this.data;

    // Building a point feature to add to the selection layer
    // Note the geometry needs to be in 4326
    var p900913 = new OpenLayers.Projection("EPSG:900913");   
    var p4326 = new OpenLayers.Projection("EPSG:4326");
    var pt = new OpenLayers.Feature.Vector();
    pt.geometry = (new OpenLayers.Geometry.Point(this.lonlat.lon, this.lonlat.lat)).transform(p900913,p4326);

    // The WKT string repreenting this feature (for highlight)
    var wkt = new OpenLayers.Format.WKT();
    var pt_wkt = wkt.write(pt);

    // All the attributes are contained in a JSON object
    var cont = {
        title : clickedFeature.title,
        description : clickedFeature.description,
        the_geom : pt_wkt
    };

    // Type
    var typ = this.layer.name;

    // Attempt to format it nicely (removing the parenthesis content)
    var simpleTitle = typ.match(/(.*) ?\(.*\)/);
    if (simpleTitle) {
        typ = helpers.trim(simpleTitle[1]);
    }

    // Layer name (without namespace), to enable additional accordion panels
    var lay = typ;

    // Label
    var lab = clickedFeature.title;

    // If too long for the drop down, we truncate the string to the space remaining after "<LAYER NAME>:"
    var num_char_in_drop_down = 32;
    if (lab.length > num_char_in_drop_down) {
        lab = lab.substring(0, num_char_in_drop_down - 2) + "..";
    }

    // Building a row and pushing it to an array
    var row_array = new Array(0, typ, cont, 0, lab, lay);
    gComboDataArray.value.push(row_array);

    // Clearing the highlight
    app.clearHighlight();
    // Managing objects in the selection layer
    app.getSelectionLayer().removeAllFeatures();
    app.getSelectionLayer().addFeatures([pt]);

    if (gComboDataArray.value.length) {
        var cb = Ext.getCmp('gtInfoCombobox');
        if (cb.disabled) { cb.enable(); }
        app.getSelectionLayer().extraVars.WFS = false;
        gCombostore.loadData(gComboDataArray.value);

        // Features found during the getFeatureInfo: showing the tab
        if (! (JSONconf.hideSelectedFeaturePanel)) {
            northPart.setHeight(60);
            Ext.getCmp('gtInfoCombobox').setVisible(true);
            // Collapsing the drop-down
            Ext.getCmp('gtInfoCombobox').collapse();
        }
        eastPanel.expand();
    }
    gComboDataArray.value = [];

    // Was in the method initially - not sure if needed anymore
    OpenLayers.Event.stop(evt);
};