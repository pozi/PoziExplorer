buildTabExpand = function(gtLayerLabel, gCurrentExpandedTabIdx, gLayoutsArr, JSONconf, gCurrentLoggedRole, helpers) {

    return function(p) {
        // Current layer (cl) as per content of the current type (ct) and current drop down (cb)
        var ct = gtLayerLabel.value;
        // that contains the type of the currently selected feature
        var cb = Ext.getCmp('gtInfoCombobox');
        // the Ext JS component containing the combo - used to link type to layer name
        var cl;
        // If the item can be found, then we extract the layer name
        if (cb.getStore().data.items[cb.getStore().find("type", ct)]) {
            cl = cb.getStore().data.items[cb.getStore().find("type", ct)].data.layer;
        } else {
            // There is no item in the drop down so the current layer is "NONE"
            cl = "NONE";
        }

        // Updating the index of the currently opened tab
        for (k in p.ownerCt.items.items) {
            if (p.ownerCt.items.items[k].id == p.id) {
                // Layer name of the currently selected item in the combo
                gCurrentExpandedTabIdx[cl] = k;
                break;
            }
        }

        // Fix for the NONE layer so that the index is not 0 and the loop just below is entered
        if (cl == "NONE") {
            gCurrentExpandedTabIdx[cl]++;
        }

        // Sending in the query to populate this specific tab (tab on demand)
        if (gCurrentExpandedTabIdx[cl] != 0) {
            var configArray = gLayoutsArr[cl];
            if (configArray) {
                // This only performs the query corresponding to the currently open tab
                for (var i = gCurrentExpandedTabIdx[cl] - 1; i < gCurrentExpandedTabIdx[cl]; i++) {
                    var g = 0;

                    // Adding a loading indicator for user feedback		
                    var targ2 = Ext.getCmp(configArray[i].id);
                    targ2.removeAll();

                    // Rendering as a table
                    var win2 = new Ext.Panel({
                        id: 'tblayout-win-loading',
                        layout: 'hbox',
                        layoutConfig: {
                            padding: '5',
                            pack: 'center',
                            align: 'middle'
                        },
                        border: false,
                        defaults: {
                            height: 26
                        },
                        items: [
                            {
                                html: '<img src="http://www.pozi.com/externals/ext/resources/images/default/grid/loading.gif"/>',
                                border: false,
                                padding: '5'
                            }
                        ]
                    });
                    targ2.add(win2);
                    targ2.doLayout();

                    // Finding the unique ID of the selected record, to pass to the live query
                    var selectedRecordIndex = cb.selectedIndex;
                    if ((selectedRecordIndex == -1) || (selectedRecordIndex >= cb.store.data.items.length)) {
                        selectedRecordIndex = 0;
                    }

                    // Property to pass to the queries
                    var idFeature;
                    var idEpsg;

                    // Special case when requesting the geometry
                    if (configArray[i].idName == "the_geom") {
                        // 2 scenarios
                        if (cb.store.data.items[selectedRecordIndex].data.content.the_geom_WFS) {
                            // Comes from a WFS call (search)
                            idFeature = cb.store.data.items[selectedRecordIndex].data.content.the_geom_WFS.geometry.toString();
                            idEpsg = "900913";
                        } else {
                            // Comes from a getFeatureInfo click
                            idFeature = cb.store.data.items[selectedRecordIndex].data.content.the_geom;
                            idEpsg = "4326";
                        }
                        idFeature = "'" + idFeature + "'," + idEpsg;
                    } else {
                        if (cl != "NONE") {
                            // Using the name configured
                            idFeature = cb.store.data.items[selectedRecordIndex].data.content[configArray[i].idName];
                        }
                    }

                    // Triggering the tab-wide actions
                    if (configArray[i].onTabOpen) {
                        // Avoiding the use of the 'eval' function
                        var fn = window[configArray[i].onTabOpen];
                        if (typeof fn === 'function') {
                            // Context passed: the id of the clicked feature
                            fn(idFeature);
                        }
                    }

                    if (configArray[i].id.substring(0, 1) != 'X') {
                        // Live query using the script tag
          
                        var ds = new Ext.data.Store({
                            autoLoad: true,
                            // Script tag proxy uses a GET method (can not be overriden to a POST)
                            // Source: http://www.sencha.com/forum/showthread.php?15916-ScriptTagProxy-with-POST-method-in-grid-with-paging
                            proxy: new Ext.data.ScriptTagProxy({
                                url: JSONconf.liveDataEndPoints[configArray[i].definition].urlLiveData
                            }),
                            reader: new Ext.data.JsonReader({
                                root: 'rows',
                                totalProperty: 'total_rows',
                                id: 'id'
                            },
                            [{
                                name: 'id',
                                mapping: 'row.id'
                            }
                            ]),
                            baseParams: {
                                // Logged in role
                                role: gCurrentLoggedRole.value,
                                // Passing the value of the property defined as containing the common ID
                                id: idFeature,
                                // Passing the tab name
                                infoGroup: configArray[i].id,
                                // Passing the database type to query
                                mode: JSONconf.liveDataEndPoints[configArray[i].definition].storeMode,
                                // Passing the database name to query
                                config: JSONconf.liveDataEndPoints[configArray[i].definition].storeName,
                                // Passing the LGA code, so that the query can be narrowed down (used for planning tab schedules links)
                                lga: JSONconf.LGACode
                            },
                            listeners:
                            {
                                load: function(store, recs)
                                {
                                    // Looping thru the records returned by the query
                                    tab_array = new Array();
                                    var geom_array = new Array();
                                    for (m = 0; m < recs.length; m++)
                                    {
                                        res_data = recs[m].json.row;
                                        var has_gsv = false;
                                        var src_attr_array = new Array();
                                        var first_element = "";

                                        for (j in res_data)
                                        {
                                            if (j != "target" && j != "tabaction" && j != "the_geom")
                                            {
                                                var val = res_data[j];

                                                if (j.search(/^gsv/) > -1)
                                                {
                                                    // Not showing the cells - technical properties for Google Street View
                                                    has_gsv = true;
                                                }
                                                else
                                                {
                                                    // Building the source array for a property grid
                                                    src_attr_array[helpers.toTitleCase(helpers.trim(j.replace(/_/g, " ")))] = helpers.trim(val);

                                                    // Setting the title of the horizontal panel - first non-null value encountered
                                                    if (first_element.length == 0)
                                                    {
                                                        if (helpers.trim(val).length > 14)
                                                        {
                                                            first_element = helpers.trim(val).substring(0, 12) + '..';
                                                        }
                                                        else
                                                        {
                                                            first_element = helpers.trim(val);
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        // Getting all geometries in an associative array
                                        // so that we're able to pass the right parameter to the subtab activate function
                                        // Note: the geometry name is necessarily "the_geom"
                                        for (j in res_data) {
                                            if (j == "the_geom") {
                                                geom_array[first_element] = res_data[j];
                                            }
                                        }

                                        // Adding a Google Street View link for selected datasets
                                        if (has_gsv) {
                                            var gsv_lat,
                                            gsv_lon,
                                            gsv_head = 0;

                                            for (var k in res_data) {
                                                if (k == "gsv_lat") {
                                                    gsv_lat = res_data[k];
                                                }
                                                if (k == "gsv_lon") {
                                                    gsv_lon = res_data[k];
                                                }
                                                if (k == "gsv_head") {
                                                    gsv_head = res_data[k];
                                                }
                                            }

                                            if (gsv_lat && gsv_lon) {
                                                // Adjusted to the size of the column
                                                var size_thumb = 335;
                                                var gsvthumb = "http://maps.googleapis.com/maps/api/streetview?location=" + gsv_lat + "," + gsv_lon + "&fov=90&heading=" + gsv_head + "&pitch=-10&sensor=false&size=" + size_thumb + "x" + size_thumb;
                                                var gsvlink = "http://maps.google.com.au/maps?layer=c&cbll=" + gsv_lat + "," + gsv_lon + "&cbp=12," + gsv_head + ",,0,0";


                                                tab_el = {
                                                    layout: 'fit',
                                                    height: size_thumb,
                                                    items: [{
                                                        html: "<div><a href='" + gsvlink + "' target='_blank'><img src='" + gsvthumb + "' style='display:block;margin:auto;'/></a></div>"
                                                    }]
                                                };
                                            }
                                        } else {
                                            // This is a different tab than Google Street View, we push the attribute names and values
                                            // By setting a title, we create a header (required to number the different tabs if multiple elements)
                                            // but if it's the only property grid, we deny it to be rendered
                                            // Based on API doc: http://docs.sencha.com/ext-js/3-4/#!/api/Ext.Panel-cfg-header
                                            tab_el = new Ext.grid.PropertyGrid({
                                                title: first_element,
                                                header: (recs.length > 1),
                                                listeners: {
                                                    'beforeedit': function(e) {
                                                        return false;
                                                    }
                                                },
                                                stripeRows: true,
                                                autoHeight: true,
                                                hideHeaders: true,
                                                // Removing the space on the right usually reserved for scrollbar
                                                viewConfig: {
                                                    forceFit: true,
                                                    scrollOffset: 0
                                                }
                                            });

                                            // Remove default sorting
                                            delete tab_el.getStore().sortInfo;
                                            tab_el.getColumnModel().getColumnById('name').sortable = false;
                                            // Managing column width ratio
                                            tab_el.getColumnModel().getColumnById('name').width = 30;
                                            tab_el.getColumnModel().getColumnById('value').width = 70;
                                            // Now load data
                                            tab_el.setSource(src_attr_array);

                                        }

                                        tab_array.push(tab_el);
                                    }

                                    // Identification of the div to render the attributes to, if there is anything to render
                                    if (recs[0]) {
                                        // The target div for placing this data
                                        var targ = Ext.getCmp(recs[0].json.row["target"]);

                                        // In some cases the tab has already been removed (i.e. targ is null)
                                        if (targ) {
                                            targ.removeAll();

                                            // Adding the listener to each subtab
                                            if (recs[0].json.row["tabaction"]) {
                                                // Avoiding the use of the 'eval' function
                                                var fn2 = window[recs[0].json.row["tabaction"]];
                                                if (typeof fn2 === 'function') {
                                                    // Going thru all the elements in the tab_array to add the listener
                                                    // Note: we can not just add a default listener in the containing panel/tabpanel
                                                    // because the elements have already been instantiated
                                                    for (b in tab_array) {
                                                        if (tab_array.hasOwnProperty(b)) {
                                                            tab_array[b].addListener('activate',
                                                            function(tab) {
                                                                tab.the_geom = geom_array[tab.title];
                                                                fn2(tab);
                                                            });
                                                        }
                                                    }
                                                }
                                            }

                                            // The container depends on the number of records returned
                                            var win;
                                            
                                            if(!configArray[i - 1].desc)
                                            	configArray[i - 1].desc = "";
                                            	
                                            if (tab_array.length == 1) {
                                                // Removing the title - it's useless
                                                // We should be able to remove the header that was created with a non-null title
                                                tab_array[0].title = undefined;

                                                // Rendering as a table
                                                win = new Ext.Panel({
                                                    id: 'tblayout-win' + g,
                                                    layout: 'fit',
                                                    bbar: {
                                                        tag: 'left',
                                                        html: '<p style="background-color: #ecedef; padding: 4px; padding-left: 8px; font-size: 12px;font-family: tahoma,arial,verdana,sans-serif; font-style:italic;">' + configArray[i - 1].desc + '</p>'
                                                    },
                                                    border: false,
                                                    items: tab_array[0]
                                                });
                                            } else {
                                                // Renderng as a tab panel of tables
                                                win = new Ext.TabPanel({
                                                    activeTab: 0,
                                                    id: 'tblayout-win' + g,
                                                    enableTabScroll: true,
                                                    resizeTabs: false,
                                                    minTabWidth: 20,
                                                    bbar: {
                                                        tag: 'left',
                                                        html: '<p style="background-color: #ecedef; padding: 4px; padding-left: 8px; font-size: 12px;font-family: tahoma,arial,verdana,sans-serif; font-style:italic;">' + configArray[i - 1].desc + '</p>'
                                                    },
                                                    border: false,
                                                    items: tab_array
                                                });
                                            }
                                            targ.add(win);
                                            targ.doLayout();
                                        }
                                    } else {
                                        // The target div for placing this data: the loading div's parent
                                        targ2.removeAll();

                                        // Rendering as a table
                                        var win3 = new Ext.Panel({
                                            id: 'tblayout-win-noresult',
                                            layout: 'hbox',
                                            layoutConfig: {
                                                padding: '5',
                                                pack: 'center',
                                                align: 'middle'
                                            },
                                            border: false,
                                            defaults: {
                                                height: 26
                                            },
                                            renderTo: targ,
                                            items: [
                                                {
                                                    html: '<p style="font-size:12px;font-family: tahoma,arial,verdana,sans-serif;">No result found</p>',
                                                    border: false,
                                                    padding: '5'
                                                }
                                            ]
                                        });
                                        targ2.add(win3);
                                        targ2.doLayout();
                                    }
                                    g++;
                                }
                            }
                        });
                    } else {
                        // Rendering a generic tab based on its HTML definition
                        // The target div for placing this data: the loading div's parent
                        targ2.removeAll();

                        // Rendering as a table
                        var win4 = new Ext.Panel({
                            id: 'tblayout-win-generic',
                            idFeature: idFeature,
                            layout: 'fit',
                            border: false,
                            items: [{ html: configArray[i].html_to_render }]
                        });
                        targ2.add(win4);
                        targ2.doLayout();
                    }
                }

            }
        }
    };

};

