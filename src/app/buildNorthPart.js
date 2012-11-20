buildNorthPart = function(JSONconf, gCombostore, gfromWFSFlag, helpers, tabExpand, gLayoutsArr, gCurrentExpandedTabIdx) { // Also uses app!

    // Defines the north part of the east panel
    return new Ext.Panel({
        region: "north",
        border: false,
        //hidden: true,
        layout: {
            type: 'vbox',
            align: 'stretch'
        },
        height: 30,
        bodyStyle: "background-color:" + JSONconf.bannerLineColor + ";",
        items: [
            {
                layout: 'column',
                height: 30,
                border: false,
                bodyStyle: "background-color:" + JSONconf.bannerLineColor + ";",
                items: [
                    {
                        html: "<p style='background-color:" + JSONconf.bannerLineColor + ";height:19px;padding:5px 8px; cursor: hand;' id='gtInfoTypeLabel'>&nbsp;</p>",
                        columnWidth: 1,
                        id: 'gtInfoTypeCmp',
                        bodyCssClass: 'selectedFeatureType',
                        listeners: {
                            render: function(c) {
                                // Expanding the drop down on click
                                c.el.on('click',
                                function() {
                                    var infoComboBox = Ext.getCmp('gtInfoCombobox');
                                    // Expand does not work directly (because custom style in drop down), using this workaround
                                    infoComboBox.keyNav.down.call(infoComboBox);
                                });
                                // Using the pointer cursor when hovering over the element
                                c.el.on('mouseover',
                                function() {
                                    this.dom.style.cursor = 'pointer';
                                });
                            },
                            scope: this
                        }
                    },
                    {
                        html: "<p style='background-color:" + JSONconf.bannerLineColor + ";'><img src='theme/app/img/panel/cross-white.png' style='padding:2px;' alt='Clear' title='Clear' /></p>",
                        width: 17,
                        bodyCssClass: 'selectedFeatureType',
                        listeners: {
                            render: function(c) {
                                // Expanding the drop down on click
                                c.el.on('click', app.clearHighlight);
                                // Using the pointer cursor when hovering over the element
                                c.el.on('mouseover', function() { this.dom.style.cursor = 'pointer'; });
                            },
                            scope: this
                        }
                    }
                ]
            },
            new Ext.form.ComboBox({
                id: 'gtInfoCombobox',
                hidden: true,
                store: gCombostore,
                displayField: 'labelx',
                disabled: true,
                mode: 'local',
                style: 'background-color: ' + JSONconf.bannerLineColor + ';',
                // Setting the background image initially to nothing
                cls: 'x-form-single',
                typeAhead: true,
                hideTrigger: true,
                forceSelection: true,
                editable: false,
                triggerAction: 'all',
                emptyText: JSONconf.emptyTextSelectFeature,
                tpl: '<tpl for="."><div class="info-item" style="height:40px;padding:5px 8px;"><b>{type}</b><br>{labelx}</div></tpl>',
                itemSelector: 'div.info-item',
                listeners: {
                    'select': function(combo, record) {
                        // Displaying the feature type
                        var ft = record.get("type");

                        gtLayerLabel.value = ft;

                        ft = ft.replace(/es\s/g, "e ");

                        if (ft.charAt(ft.length - 2) != 's' && ft.charAt(ft.length - 1) == 's') {
                            ft = ft.replace(/s$/, "");
                            Ext.get('gtInfoTypeLabel').dom.innerHTML = ft.replace(/ie$/, "y");
                        } else {
                            Ext.get('gtInfoTypeLabel').dom.innerHTML = ft;
                        }

                        // Displaying the different tabs in the accordion
                        var e0 = Ext.getCmp('gtAccordion');
                        e0.removeAll();

                        // Whatever the current expanded tab is, we populate the direct attributes accordion panel
                        var lab;
                        var val;
                        var item_array = new Array();
                        var has_gsv = false;
                        var fa = [],
                        fte = [];

                        // Working out the layer presentation configuration
                        // Current layer name
                        var cl = record.get("layer");
                        // Configuration field array
                        var fti_arr = JSONconf.layerPresentation[cl];
                        // Arrays to store ordered attribute names and values
                        var an_arr,
                        av_arr;
                        if (fti_arr) {
                            an_arr = new Array(fti_arr.length);
                            av_arr = new Array(fti_arr.length);
                        }

                        for (var k in record.data.content) {
                            if (k == "the_geom" || k == "SHAPE") {
                                var featureToRead = record.data.content[k];
                                var wktObj = new OpenLayers.Format.WKT({
                                    externalProjection: new OpenLayers.Projection("EPSG:4326"),
                                    //projection your data is in
                                    internalProjection: new OpenLayers.Projection("EPSG:900913")
                                    //projection you map uses to display stuff
                                });
                                var wktfeatures = wktObj.read(featureToRead);

                                // Should be able to select several if the control key is pressed
                                app.getSelectionLayer().removeAllFeatures();
                                app.getSelectionLayer().addFeatures(wktfeatures);

                            } else if (k == "the_geom_WFS") {
                                var wktfeatures = record.data.content[k];
                                gfromWFSFlag.value = "N";
                                app.getSelectionLayer().removeAllFeatures();
                                app.getSelectionLayer().addFeatures(wktfeatures);
                            } else {
                                lab = k;
                                val = record.data.content[k];

                                // Processing the fields according to presentation configuration array
                                if (fti_arr) {
                                    // Locating the index the current attribute should be positioned at
                                    for (q = 0; q < fti_arr.length; q++) {
                                        if (fti_arr[q].attr_name == lab) {
                                            // Substitution with a optional alternate name
                                            if (fti_arr[q].alt_name) {
                                                an_arr[q] = fti_arr[q].alt_name;
                                            } else {
                                                // If no alternate name, just the normal clean title case
                                                an_arr[q] = helpers.toTitleCase(helpers.trim(lab.replace(/_/g, " ")));
                                            }
                                            av_arr[q] = helpers.trim(val);
                                            break;
                                        }
                                    }

                                } else {
                                    // Pushing this element in the source of the property grid
                                    fa[helpers.toTitleCase(helpers.trim(lab.replace(/_/g, " ")))] = helpers.trim(val);
                                }
                            }

                        }

                        // Ordered population of the source data for the grid
                        if (fti_arr) {
                            // We build the fa object based on the 2 arrays of attributes names and values
                            for (q = 0; q < fti_arr.length; q++) {
                                fa[an_arr[q]] = av_arr[q];
                            }
                        }

                        var p = new Ext.grid.PropertyGrid({
                            listeners: {
                                'beforeedit': function(e) {
                                    return false;
                                }
                            },
                            stripeRows: true,
                            autoHeight: true,
                            hideHeaders: true,
                            viewConfig: {
                                forceFit: true,
                                scrollOffset: 0
                            }
                        });

                        // Remove default sorting
                        delete p.getStore().sortInfo;
                        p.getColumnModel().getColumnById('name').sortable = false;
                        // Managing column width ratio
                        p.getColumnModel().getColumnById('name').width = 30;
                        p.getColumnModel().getColumnById('value').width = 70;
                        // Now load data
                        p.setSource(fa);

                        var panel = new Ext.Panel({
                            id: 'attributeAcc',
                            headerCfg: {
                                tag: 'div',
                                style: '	background-image: none;background-color: #A0A0A0;padding-left: 10px;',
                                children: [
                                    {
                                        tag: 'div',
                                        'html': '<img style="vertical-align: middle;" src="theme/app/img/panel/details.png"/>' + '&nbsp &nbsp' + JSONconf.detailsTitle
                                    }
                                ]
                            },
                            layout: 'fit',
                            // style: couldn't find a way to override the style inherited from the parent (gtAccordion)
                            items: [p],
                            listeners: {
                                scope: this,
                                expand: tabExpand
                            }
                        });

                        e0.add(panel);

                        // Layout configuration the global variable array loaded at application start										
                        var configArray = gLayoutsArr[record.data.layer];
                        if (configArray) {
                            // Here we should do the styling substitution to transform a config option into a proper style element
                            for (c in configArray) {
                                if (! (configArray[c].headerCfg)) {
                                    var t = configArray[c].title;
                                    // Header config would not work if the title was part of the initial config
                                    delete configArray[c].title;

                                    var col = configArray[c].col;

                                    var lock = configArray[c].lock;

                                    var icon = configArray[c].icon;

                                    if (! (col)) {
                                        col = "#A0A0A0";
                                    }

                                    if (lock) {
                                        lock = "background-image: url(theme/app/img/panel/lock.png);";
                                    }

                                    if (!icon) {
                                        icon = '<img style="vertical-align: middle;"src="theme/app/img/panel/earth.png"/>';
                                    }

                                    configArray[c].headerCfg = {
                                        tag: 'div',
                                        style: lock + 'background-position: right; background-repeat: no-repeat; background-color:' + col + ';padding-left: 10px; vertical-align: middle;',
                                        children: [
                                            {
                                                tag: 'div',
                                                'html': icon + '&nbsp &nbsp' + t
                                            }
                                        ]
                                    };
                                }
                            }

                            // And initialisation of the accordion items
                            e0.add(configArray);
                        }

                        // Refreshing the DOM with the newly added parts
                        e0.doLayout();

                        /// Expanding the tab whose index has been memorised
                        if (! (gCurrentExpandedTabIdx[record.data.layer])) {
                            gCurrentExpandedTabIdx[record.data.layer] = 0;
                        }
                        e0.items.itemAt(gCurrentExpandedTabIdx[record.data.layer]).expand();
                    },
                    scope: this
                }

            })
        ]
    });

};

