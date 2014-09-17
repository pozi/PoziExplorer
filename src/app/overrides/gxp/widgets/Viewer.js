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
                        baseRecords.unshift(record);
                    } else {
                        overlayRecords.unshift(record);
                    }
                }
            }
        }
        
        // http://sabrelabs.com/post/48201437312/javascript-spaceship-operator
        var spaceship_operator = function(a, b) {
            if (typeof a === 'string') {
                return (a).localeCompare(b);
            } else {
                if (a > b) {
                    return 1;
                } else if (a < b) {
                    return -1;
                }
                return 0;
            }
        }

        _(baseRecords).each(function(record, index) {
            record.original_order = index;
        });

        // sort background records so visible layers are first
        // this is largely a workaround for an OpenLayers Google Layer issue
        // http://trac.openlayers.org/ticket/2661
        baseRecords.sort(function(a, b) {
            // sort function is supposed to return -1, 0 or 1
            // http://stackoverflow.com/questions/5428236/javascript-sort-not-working-with-ie9

            // Reverse alphabetical order on group name (so that "background" is before = under "aerial")
            var group_order = spaceship_operator(b.get("group"), a.get("group"));
            if (group_order !== 0) {
                return group_order;
            } else {
                // Within each of these groups, original order is maintained
                return spaceship_operator(a.original_order, b.original_order);
            }
        });

        var panel = this.mapPanel;
        var map = panel.map;
        
        var records = baseRecords.concat(overlayRecords);
        if (records.length) {
            panel.layers.add(records);
        }

        // Adding support for WFS vector layers (select feature control)
        // Building an array of all vector layers so that the select control spans all these layers
        var vectorLayers = panel.layers.data.items.filter(function(x){
            return ((x.get("type") === "OpenLayers.Layer.Vector") && (x.get("title") != "Selection"));
        });

        // Proper OpenLayers layer objects are nested within these GXP objects
        for (var ii=0; ii < vectorLayers.length; ii++)
        {
            vectorLayers[ii] = vectorLayers[ii].data.layer;
        }

        var addSelectFeature = function () {
            var selectFeature = new OpenLayers.Control.SelectFeature(
                vectorLayers, 
                {
                    multiple: false,
                    highlightOnly: true,
                    eventListeners: {
                        featureunhighlighted: function(event){
                            //console.log("Unhighlighting a feature.");

                            // Flag for WMS getFeatureInfo to not overwrite the combo content
                            app.getSelectionLayer().extraVars.Vector = true;
                            // Flag for the clearHighlight to detect if a feature is curently selected
                            if (!app.getSelectionLayer().extraVars.VectorSelected)
                            {
                                // Clearing the highlight
                                app.clearHighlightWithCollapse();
                            }
                            else
                            {
                                // Setting the select feature as "not selected"
                                app.getSelectionLayer().extraVars.VectorSelected = false;                  
                            }
                        },
                        featurehighlighted: function(event){
                            //console.log("Highlighting a feature.");

                            var clickedFeature = event.feature.data;

                            // Building a point feature to add to the selection layer
                            var pt = new OpenLayers.Feature.Vector();
                            pt.geometry = (new OpenLayers.Geometry.Point(event.feature.geometry.x, event.feature.geometry.y));

                            // The WKT string repreenting this feature (for highlight)
                            var wkt = new OpenLayers.Format.WKT();
                            var pt_wkt = wkt.write(pt);

                            // All the attributes are contained in a JSON object
                            var cont = clickedFeature;

                            // Type
                            var typ = event.feature.layer.name;

                            // Attempt to format it nicely (removing the parenthesis content)
                            var simpleTitle = typ.match(/(.*) ?\(.*\)/);
                            if (simpleTitle) {
                                typ = helpers.trim(simpleTitle[1]);
                            }

                            // Layer name (without namespace), to enable additional accordion panels
                            var lay = typ;

                            // Label - returns the value of the 1st property in the object
                            var lab = clickedFeature[Object.keys(clickedFeature)[0]];
                            for (var jj=0; jj < Object.keys(clickedFeature).length; jj++)
                            {
                                if (!helpers.isNumber(clickedFeature[Object.keys(clickedFeature)[jj]]))
                                {
                                    lab = clickedFeature[Object.keys(clickedFeature)[jj]];
                                    break;
                                }
                            }

                            // If too long for the drop down, we truncate the string to the space remaining after "<LAYER NAME>:"
                            var num_char_in_drop_down = 32;
                            if (lab.length > num_char_in_drop_down) {
                                lab = lab.substring(0, num_char_in_drop_down - 2) + "..";
                            }

                            // Building a row and pushing it to an array
                            var row_array = new Array(0, typ, cont, 0, lab, lay);
                            gComboDataArray.value.push(row_array);

                            if (gComboDataArray.value.length) {
                                app.getSelectionLayer().extraVars.Vector = true;

                                // Clearing the highlight
                                app.clearHighlight();
                                // Managing objects in the selection layer
                                app.getSelectionLayer().removeAllFeatures();
                                app.getSelectionLayer().addFeatures([pt]);

                                // Setting the select feature as "selected"
                                app.getSelectionLayer().extraVars.VectorSelected = true;

                                var cb = Ext.getCmp('gtInfoCombobox');
                                if (cb.disabled) { cb.enable(); }

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
                        }
                    }
                }
            );

            panel.map.addControl(selectFeature);
            selectFeature.activate();
        };
        addSelectFeature();
        
    }        
};
