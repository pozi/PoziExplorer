// Function to execute on successful return of the JSON configuration file loading
var onConfigurationLoaded = function(JSONconf) {

    // Encapsulating the loading of the main app in a callback
    var extraJSScriptLoaded = function() {

        // Fixing local URL source for debug mode
        if (JSONconf.sources.local)
        {
            JSONconf.sources.local.url = gtLocalLayerSourcePrefix + JSONconf.sources.local.url;
        }

        // Global variables all clients
        var gtEmptyTextSearch = 'Find address, road, feature, etc...';
        var gtLoadingText = 'Searching...';
        var gtLoadingText = "Loading ...";
        var gtDetailsTitle = "Details";
        var gtClearButton = "Clear";
        var gtEmptyTextSelectFeature = "Selected feature ...";
        var gtEmptyTextQuickZoom = "Zoom to town ...";

        // Transforming the map contexts variable into the right format
        var gtMapContexts = JSONconf.mapContexts;
        if (gtMapContexts.length == 0) {
            gtMapContexts = "&nbsp;";
            gtMapContextsSize = 0;
        } else {
            if (gtMapContexts.length == 1) {
                gtMapContextsSize = gtMapContexts[0].size;
                gtMapContexts = gtMapContexts[0].name;
            } else {
                // TODO: format the contexts into a drop down loading different layers
            }
        }


        // This structure deals with fields to show, in which order and with which name
        gtLayerPresentationConfiguration = {
            "VICMAP_PROPERTY_ADDRESS": [
                { attr_name: "ezi_add", alt_name: "Address" },
                { attr_name: "pr_propnum", alt_name: "Property Number" },
                { attr_name: "locality" },
                { attr_name: "postcode" },
                { attr_name: "lga_code", alt_name: "LGA" },
                { attr_name: "pr_multass", alt_name: "Multi Assessment" },
                { attr_name: "pfi", alt_name: "PFI" }
            ]
        };
        // Augment this structure with the client-specific JSON configuration
        Ext.apply(gtLayerPresentationConfiguration, JSONconf.layerPresentation)


        var gtInitialDisclaimerFlag = true;
        var gtDisclaimer = "disclaimer.html";
        var gtRedirectIfDeclined = "http://www.mitchellshire.vic.gov.au/";

        // Layout for the extra tabs
        gLayoutsArr = [];

        // Flag to track the origin of the store refresh
        var gfromWFSFlag = "N";

        // WFS layer: style , definition , namespaces
        var gtStyleMap = new OpenLayers.StyleMap();
        var rule_for_all = new OpenLayers.Rule({
            symbolizer: JSONconf.highlightSymboliser,
            elseFilter: true
        });
        rule_for_all.title = " ";
        gtStyleMap.styles["default"].addRules([rule_for_all]);

        // Pushing the WFS layer in the layer store
        JSONconf.layers.push({
            source: "ol",
            visibility: true,
            type: "OpenLayers.Layer.Vector",
            group: "top",
            args: [
            "Selection", {
                styleMap: gtStyleMap,
                strategies: [new OpenLayers.Strategy.BBOX({
                    ratio: 100
                })],
                protocol: new OpenLayers.Protocol.WFS({
                    version: "1.1.0",
                    url: JSONconf.servicesHost + JSONconf.WFSEndPoint,
                    featureType: "VMPROP_PROPERTY",
                    srsName: JSONconf.WFSsrsName,
                    featureNS: JSONconf.FeatureNS,
                    geometryName: JSONconf.WFSgeometryName,
                    schema: JSONconf.servicesHost + JSONconf.WFSEndPoint + "?service=WFS&version=1.1.0&request=DescribeFeatureType&TypeName=" + "VICMAP:VMPROP_PROPERTY"
                }),
                filter: new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                    property: 'pr_propnum',
                    value: -1
                }),
                projection: new OpenLayers.Projection("EPSG:4326")
            }
            ]
        });

        // Store behind the info drop-down list
        gCombostore = new Ext.data.ArrayStore({
            //autoDestroy: true,
            storeId: 'myStore',
            idIndex: 0,
            fields: [
            'id',
            'type',
            'content',
            'index',
            'label',
            'layer',
            {
                name: 'labelx',
                convert: function(v, rec) {
                    return toSmartTitleCase(rec[4]);
                }
            }
            ],
            listeners: {
                load: function(ds, records, o) {
                    var cb = Ext.getCmp('gtInfoCombobox');
                    var rec = records[0];
                    if (records.length > 1)
                    {
                        // Multiple records, color of the combo background is different
                        cb.removeClass("x-form-single");
                        cb.addClass("x-form-multi");
                    }
                    else
                    {
                        // Restoring the color to a normal white
                        cb.removeClass("x-form-multi");
                        cb.addClass("x-form-single");

                        // Collapsing the drop down
                        cb.collapse();
                    }
                    cb.setValue(rec.data.labelx);
                    cb.fireEvent('select', cb, rec);
                },
                scope: this
            }
        });

        var ds = new Ext.data.JsonStore({
            autoLoad: false,
            //autoload the data
            root: 'rows',
            baseParams: {
                config: JSONconf.databaseConfig,
                lga: JSONconf.LGACode
            },
            fields: [
                { name: "label", mapping: "row.label" },
                { name: "xmini", mapping: "row.xmini" },
                { name: "ymini", mapping: "row.ymini" },
                { name: "xmaxi", mapping: "row.xmaxi" },
                { name: "ymaxi", mapping: "row.ymaxi" },
                { name: "gsns",  mapping: "row.gsns" },
                { name: "gsln",  mapping: "row.gsln" },
                { name: "idcol", mapping: "row.idcol" },
                { name: "idval", mapping: "row.idval" },
                { name: "ld",    mapping: "row.ld" }
            ],
            proxy: new Ext.data.ScriptTagProxy({
                url: JSONconf.servicesHost + JSONconf.searchEndPoint
            })
        });

        // Adding the default tabs
        add_default_tabs = function() {
            // Clearing the details from the panel
            accordion.removeAll();

            // Layout configuration the global variable array loaded at application start										
            var configArray = gLayoutsArr["NONE"];
            if (configArray)
            {
                // Here we should do the styling substitution to transform a config option into a proper style element
                for (c in configArray)
                {
                    if (configArray.hasOwnProperty(c))
                    {
                        if (! (configArray[c].headerCfg))
                        {
                            var t = configArray[c].title;
                            // headerCfg would not work if the title was part of the initial config
                            delete configArray[c].title;

                            var col = configArray[c].col;

                            if (! (col))
                            {
                                col = "#A0A0A0";
                            }

                            configArray[c].headerCfg = {
                                tag: 'div',
                                style: '	background-image: url();background-color: ' + col + ';padding-left: 10px;',
                                children: [
                                {
                                    tag: 'div',
                                    'html': t
                                }
                                ]
                            };
                        }
                    }
                }

                // And initialisation of the accordion items
                accordion.add(configArray);

            }

            // Refreshing the DOM with the newly added parts
            accordion.doLayout();

            // Expanding the first tab if configured to do so
            if (JSONconf.openFirstDefaultTab)
            {
                accordion.items.items[0].expand();
            }
        };

        // Remove the WFS highlight, clear and disable the select feature combo, empty the combostore and clean the details panel
        clear_highlight = function() {
            // Removing the highlight by clearing the selected features in the WFS layer
            glayerLocSel.removeAllFeatures();
            glayerLocSel.redraw();
            // Clearing combo
            var cb = Ext.getCmp('gtInfoCombobox');
            cb.collapse();
            cb.clearValue();
            cb.disable();
            cb.removeClass("x-form-multi");
            cb.addClass("x-form-single");

            // Removing all values from the combo
            gCombostore.removeAll();

            // Add default tabs
            add_default_tabs()

            // Hiding the north part of the east panel
            northPart.setHeight(30);
            cb.setVisible(false);

            // Clearing the feature type
            Ext.get('gtInfoTypeLabel').dom.innerHTML = "&nbsp;";

        };

        // Panels and portals
        westPanel = new Ext.Panel({
            id: "westpanel",
            border: false,
            layout: "anchor",
            region: "west",
            width: 250,
            split: true,
            border: true,
            collapsible: true,
            collapseMode: "mini",
            collapsed: JSONconf.collapseWestPanel,
            hideCollapseTool: true,
            autoScroll: true,
            // Only padding on the right as all other sides covered by the parent container
            style: "padding: 0px 10px 0px 0px; background-color:white;",
            headerCfg: {
                // Required to have the footer display
                html: '<p style="font-size:16px;font-family: tahoma,arial,verdana,sans-serif;">Layers</p>',
                bodyStyle: " background-color: white; "
            },
            headerStyle: 'background-color:' + JSONconf.bannerLineColor + ';border:0px; margin:0px 0px 0px; padding: 5px 8px;',
            items: [{
                region: 'center',
                border: false,
                id: 'tree'
            }]
        });

        var tabCollapse = function(p) {
            // Current layer (cl) as per content of the current type (ct) and current drop down (cb)
            var ct = gtLayerLabel;
            // that contains the type of the currently selected feature
            var cb = Ext.getCmp('gtInfoCombobox');
            // the Ext JS component containing the combo - used to link type to layer name
            var cl;
            // If the item can be found, then we extract the layer name
            if (cb.getStore().data.items[cb.getStore().find("type", ct)])
            {
                cl = cb.getStore().data.items[cb.getStore().find("type", ct)].data.layer;
            }
            else
            // There is no item in the drop down and the current layer is "NONE"
            {
                cl = "NONE";
            }

            if (gCurrentExpandedTabIdx[cl] != 0)
            {
                var configArray = gLayoutsArr[cl];

                if (configArray)
                {
                    // This only performs the query corresponding to the currently open tab
                    for (var i = gCurrentExpandedTabIdx[cl] - 1; i < gCurrentExpandedTabIdx[cl]; i++)
                    {
                        // Triggering the tab-wide actions
                        if (configArray[i].onTabClose)
                        {
                            // Avoiding the use of the 'eval' function
                            var fn = window[configArray[i].onTabClose];
                            if (typeof fn === 'function') {
                                // Context passed: the id of the clicked feature
                                fn();
                            }
                        }
                    }
                }
            }
        };

        var tabExpand = function(p) {
            // Current layer (cl) as per content of the current type (ct) and current drop down (cb)
            var ct = gtLayerLabel;
            // that contains the type of the currently selected feature
            var cb = Ext.getCmp('gtInfoCombobox');
            // the Ext JS component containing the combo - used to link type to layer name
            var cl;
            // If the item can be found, then we extract the layer name
            if (cb.getStore().data.items[cb.getStore().find("type", ct)])
            {
                cl = cb.getStore().data.items[cb.getStore().find("type", ct)].data.layer;
            }
            else
            // There is no item in the drop down so the current layer is "NONE"
            {
                cl = "NONE";
            }

            // Updating the index of the currently opened tab
            for (k in p.ownerCt.items.items)
            {
                if (p.ownerCt.items.items[k].id == p.id)
                {
                    // Layer name of the currently selected item in the combo
                    gCurrentExpandedTabIdx[cl] = k;
                    break;
                }
            }

            // Fix for the NONE layer so that the index is not 0 and the loop just below is entered
            if (cl == "NONE")
            {
                gCurrentExpandedTabIdx[cl]++;
            }

            // Sending in the query to populate this specific tab (tab on demand)
            if (gCurrentExpandedTabIdx[cl] != 0)
            {
                var configArray = gLayoutsArr[cl];
                if (configArray)
                {
                    // This only performs the query corresponding to the currently open tab
                    for (var i = gCurrentExpandedTabIdx[cl] - 1; i < gCurrentExpandedTabIdx[cl]; i++)
                    {
                        var g = 0;

                        // Adding a loading indicator for user feedback		
                        var targ2 = Ext.getCmp(configArray[i].id);
                        targ2.removeAll();

                        // Rendering as a table
                        var win2 = new Ext.Panel({
                            id: 'tblayout-win-loading'
                            ,
                            layout: 'hbox'
                            ,
                            layoutConfig: {
                                padding: '5',
                                pack: 'center',
                                align: 'middle'
                            }
                            ,
                            border: false
                            ,
                            defaults: {
                                height: 26
                            }
                            ,
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
                        if ((selectedRecordIndex == -1) || (selectedRecordIndex >= cb.store.data.items.length))
                        {
                            selectedRecordIndex = 0;
                        }

                        // Property to pass to the queries
                        var idFeature,
                        idEpsg;

                        // Special case when requesting the geometry
                        if (configArray[i].idName == "the_geom")
                        {
                            // 2 scenarios
                            if (cb.store.data.items[selectedRecordIndex].data.content.the_geom_WFS)
                            {
                                // Comes from a WFS call (search)
                                idFeature = cb.store.data.items[selectedRecordIndex].data.content.the_geom_WFS.geometry.toString();
                                idEpsg = "900913";

                            }
                            else
                            {
                                // Comes from a getFeatureInfo click
                                idFeature = cb.store.data.items[selectedRecordIndex].data.content.the_geom;
                                idEpsg = "4326";
                            }
                            idFeature = "'" + idFeature + "'," + idEpsg;
                        }
                        else
                        {
                            if (cl != "NONE")
                            {
                                // Using the name configured
                                idFeature = cb.store.data.items[selectedRecordIndex].data.content[configArray[i].idName];
                            }
                        }

                        // Triggering the tab-wide actions
                        if (configArray[i].onTabOpen)
                        {
                            // Avoiding the use of the 'eval' function
                            var fn = window[configArray[i].onTabOpen];
                            if (typeof fn === 'function') {
                                // Context passed: the id of the clicked feature
                                fn(idFeature);
                            }
                        }

                        if (configArray[i].id.substring(0, 1) != 'X')
                        {
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
                                    role: gCurrentLoggedRole,
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
                                                        src_attr_array[toTitleCase(trim(j.replace(/_/g, " ")))] = trim(val);

                                                        // Setting the title of the horizontal panel - first non-null value encountered
                                                        if (first_element.length == 0)
                                                        {
                                                            if (trim(val).length > 14)
                                                            {
                                                                first_element = trim(val).substring(0, 12) + '..';
                                                            }
                                                            else
                                                            {
                                                                first_element = trim(val);
                                                            }
                                                        }
                                                    }
                                                }
                                            }

                                            // Getting all geometries in an associative array
                                            // so that we're able to pass the right parameter to the subtab activate function
                                            // Note: the geometry name is necessarily "the_geom"
                                            for (j in res_data)
                                            {
                                                if (j == "the_geom") {
                                                    geom_array[first_element] = res_data[j];
                                                }
                                            }

                                            // Adding a Google Street View link for selected datasets
                                            if (has_gsv)
                                            {
                                                var gsv_lat,
                                                gsv_lon,
                                                gsv_head = 0;

                                                for (var k in res_data)
                                                {
                                                    if (k == "gsv_lat")
                                                    {
                                                        gsv_lat = res_data[k];
                                                    }
                                                    if (k == "gsv_lon")
                                                    {
                                                        gsv_lon = res_data[k];
                                                    }
                                                    if (k == "gsv_head")
                                                    {
                                                        gsv_head = res_data[k];
                                                    }
                                                }

                                                if (gsv_lat && gsv_lon)
                                                {
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
                                            }
                                            else
                                            {
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
                                        if (recs[0])
                                        {
                                            // The target div for placing this data
                                            var targ = Ext.getCmp(recs[0].json.row["target"]);

                                            // In some cases the tab has already been removed (i.e. targ is null)
                                            if (targ)
                                            {
                                                targ.removeAll();

                                                // Adding the listener to each subtab
                                                if (recs[0].json.row["tabaction"])
                                                {
                                                    // Avoiding the use of the 'eval' function
                                                    var fn2 = window[recs[0].json.row["tabaction"]];
                                                    if (typeof fn2 === 'function') {
                                                        // Going thru all the elements in the tab_array to add the listener
                                                        // Note: we can not just add a default listener in the containing panel/tabpanel
                                                        // because the elements have already been instantiated
                                                        for (b in tab_array)
                                                        {
                                                            if (tab_array.hasOwnProperty(b))
                                                            {
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
                                                if (tab_array.length == 1)
                                                {
                                                    // Removing the title - it's useless
                                                    // We should be able to remove the header that was created with a non-null title
                                                    tab_array[0].title = undefined;

                                                    // Rendering as a table
                                                    var win = new Ext.Panel({
                                                        id: 'tblayout-win' + g,
                                                        layout: 'fit',
                                                        bbar: true,
                                                        bbarCfg: {
                                                            tag: 'left',
                                                            html: '<p style="background-color: #ecedef; padding: 4px; padding-left: 8px; font-size: 12px;font-family: tahoma,arial,verdana,sans-serif; font-style:italic;">' + configArray[i - 1].desc + '</p>'
                                                        },
                                                        border: false,
                                                        items: tab_array[0]
                                                    });
                                                }
                                                else
                                                {
                                                    // Renderng as a tab panel of tables
                                                    var win = new Ext.TabPanel({
                                                        activeTab: 0,
                                                        id: 'tblayout-win' + g,
                                                        enableTabScroll: true,
                                                        resizeTabs: false,
                                                        minTabWidth: 20,
                                                        bbar: true,
                                                        bbarCfg: {
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
                                        }
                                        else
                                        {
                                            // The target div for placing this data: the loading div's parent
                                            targ2.removeAll();

                                            // Rendering as a table
                                            var win3 = new Ext.Panel({
                                                id: 'tblayout-win-noresult'
                                                //,width:227
                                                ,
                                                layout: 'hbox'
                                                ,
                                                layoutConfig: {
                                                    padding: '5',
                                                    pack: 'center',
                                                    align: 'middle'
                                                }
                                                ,
                                                border: false
                                                ,
                                                defaults: {
                                                    height: 26
                                                }
                                                ,
                                                renderTo: targ
                                                ,
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
                        }
                        else
                        {
                            // Rendering a generic tab based on its HTML definition
                            // The target div for placing this data: the loading div's parent
                            targ2.removeAll();

                            // Rendering as a table
                            var win4 = new Ext.Panel({
                                id: 'tblayout-win-generic'
                                //,width:227
                                ,
                                idFeature: idFeature
                                ,
                                layout: 'fit'
                                ,
                                border: false
                                ,
                                items: [
                                {
                                    html: configArray[i].html_to_render
                                }
                                ]
                            });
                            targ2.add(win4);
                            targ2.doLayout();
                        }
                    }

                }
            }
        };

        // Defines the north part of the east panel
        northPart = new Ext.Panel({
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
                            c.el.on('click',
                            function() {
                                // Removing highlight and emptying combo
                                clear_highlight();
                            });
                            // Using the pointer cursor when hovering over the element
                            c.el.on('mouseover',
                            function() {
                                this.dom.style.cursor = 'pointer';
                            });
                        },
                        scope: this
                    }
                }]
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
                emptyText: gtEmptyTextSelectFeature,
                tpl: '<tpl for="."><div class="info-item" style="height:40px;padding:5px 8px;"><b>{type}</b><br>{labelx}</div></tpl>',
                itemSelector: 'div.info-item',
                listeners: {
                    'select': function(combo, record) {
                        // Displaying the feature type
                        var ft = record.get("type");

                        gtLayerLabel = ft;

                        ft = ft.replace(/es\s/g, "e ");

                        if (ft.charAt(ft.length - 2) != 's' && ft.charAt(ft.length - 1) == 's')
                        {
                            ft = ft.replace(/s$/, "");
                            Ext.get('gtInfoTypeLabel').dom.innerHTML = ft.replace(/ie$/, "y");
                        }
                        else
                        {
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
                        var fti_arr = gtLayerPresentationConfiguration[cl];
                        // Arrays to store ordered attribute names and values
                        var an_arr,
                        av_arr;
                        if (fti_arr)
                        {
                            an_arr = new Array(fti_arr.length);
                            av_arr = new Array(fti_arr.length);
                        }

                        for (var k in record.data.content)
                        {
                            if (k == "the_geom" || k == "SHAPE")
                            {
                                var featureToRead = record.data.content[k];
                                var wktObj = new OpenLayers.Format.WKT({
                                    externalProjection: new OpenLayers.Projection("EPSG:4326"),
                                    //projection your data is in
                                    internalProjection: new OpenLayers.Projection("EPSG:900913")
                                    //projection you map uses to display stuff
                                });
                                var wktfeatures = wktObj.read(featureToRead);

                                // Should be able to select several if the control key is pressed
                                glayerLocSel.removeAllFeatures();
                                glayerLocSel.addFeatures(wktfeatures);

                            }
                            else if (k == "the_geom_WFS")
                            {
                                var wktfeatures = record.data.content[k];
                                gfromWFSFlag = "N";
                                glayerLocSel.removeAllFeatures();
                                glayerLocSel.addFeatures(wktfeatures);
                            }
                            else
                            {
                                lab = k;
                                val = record.data.content[k];

                                // Processing the fields according to presentation configuration array
                                if (fti_arr)
                                {
                                    // Locating the index the current attribute should be positioned at
                                    for (q = 0; q < fti_arr.length; q++)
                                    {
                                        if (fti_arr[q].attr_name == lab)
                                        {
                                            // Substitution with a optional alternate name
                                            if (fti_arr[q].alt_name)
                                            {
                                                an_arr[q] = fti_arr[q].alt_name;
                                            }
                                            else
                                            {
                                                // If no alternate name, just the normal clean title case
                                                an_arr[q] = toTitleCase(trim(lab.replace(/_/g, " ")));
                                            }
                                            av_arr[q] = trim(val);
                                            break;
                                        }
                                    }

                                }
                                else
                                {
                                    // Pushing this element in the source of the property grid
                                    fa[toTitleCase(trim(lab.replace(/_/g, " ")))] = trim(val);
                                }
                            }

                        }

                        // Ordered population of the source data for the grid
                        if (fti_arr)
                        {
                            // We build the fa object based on the 2 arrays of attributes names and values
                            for (q = 0; q < fti_arr.length; q++)
                            {
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
                                style: '	background-image: url();background-color: #A0A0A0;padding-left: 10px;',
                                children: [
                                {
                                    tag: 'div',
                                    'html': '<img style="vertical-align: middle;"src="theme/app/img/panel/details.png"/>' + '&nbsp &nbsp' + gtDetailsTitle
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
                        if (configArray)
                        {
                            // Here we should do the styling substitution to transform a config option into a proper style element
                            for (c in configArray)
                            {
                                if (! (configArray[c].headerCfg))
                                {
                                    var t = configArray[c].title;
                                    // Header config would not work if the title was part of the initial config
                                    delete configArray[c].title;

                                    var col = configArray[c].col;

                                    var lock = configArray[c].lock;

                                    var icon = configArray[c].icon;

                                    if (!configArray[c].desc)
                                    configArray[c].desc = "";

                                    if (! (col))
                                    {
                                        col = "#A0A0A0";
                                    }

                                    if (lock)
                                    {
                                        lock = "background-image: url(theme/app/img/panel/lock.png);";
                                    }

                                    if (!icon)
                                    {
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
                        if (! (gCurrentExpandedTabIdx[record.data.layer]))
                        {
                            gCurrentExpandedTabIdx[record.data.layer] = 0;
                        }
                        e0.items.itemAt(gCurrentExpandedTabIdx[record.data.layer]).expand();
                    },
                    scope: this
                }

            })
            ]
        });

        var accordion = new Ext.Panel({
            id: 'gtAccordion',
            layout: 'accordion',
            region: "center",
            border: false,
            rowHeight: 1,
            collapsible: false,
            autoScroll: true,
            defaults: {
                // applied to each contained panel
                bodyStyle: " background-color: transparent ",
                style: "padding:10px 0px 0px;",
                collapsed: true,
                listeners: {
                    scope: this,
                    expand: tabExpand,
                    collapse: tabCollapse
                }
            },
            layoutConfig: {
                // layout-specific configs go here
                animate: false,
                titleCollapse: true,
                activeOnTop: false,
                hideCollapseTool: false,
                fill: false
            }
        });

        var bottomEastItem = {
            border: false
        };
        if (JSONconf.bottomEastItem)
        {
            bottomEastItem =
            {
                id: 'bottomEastItem',
                title: JSONconf.bottomEastItem.title,
                html: "<iframe src='" + JSONconf.bottomEastItem.URL + "' height='" + JSONconf.bottomEastItem.height + "' frameborder='0' />",
                collapsible: true,
                animCollapse: false,
                border: false,
                height: JSONconf.bottomEastItem.height,
                listeners: {
                    scope: this,
                    expand: function(p) {
                        eastPanel.doLayout();
                    },
                    collapse: function(p) {
                        eastPanel.doLayout();
                    }
                }
            };
        }

        eastPanel = new Ext.Panel({
            border: false,
            layout: "ux.row",
            region: "east",
            // Padding only on the left, as all over basis are covered by the parent container
            style: "padding: 0px 0px 0px 10px; background-color:white;",
            collapseMode: "mini",
            collapsed: JSONconf.eastPanelCollapsed,
            width: 350,
            listeners: {
                scope: this,
                resize: function(p) {
                    // This is required to get the content of the accordion tabs to resize
                    for (i in p.items.items)
                    {
                        // hasOwnProperty appropriate way to deal with direct property of this object, not inherited ones
                        // In the case on an array, direct members are indexes
                        if (p.items.items.hasOwnProperty(i))
                        {
                            p.items.items[i].doLayout();
                        }
                    }
                }
            },
            split: true,
            items: [
            northPart,
            accordion,
            bottomEastItem
            ]
        });

        var portalItems = [
        {
            region: "north",
            layout: "column",
            height: 100,
            bodyStyle: 'border:0px;',
            items:
            [
            new Ext.BoxComponent({
                region: "west",
                width: JSONconf.logoClientWidth,
                bodyStyle: " background-color: transparent ",
                html: '<img style="height: 90px" src="' + JSONconf.logoClientSrc + '" align="right"/>'
            })
            ,
            {
                columnWidth: 0.5,
                html: "",
                height: 100,
                border: false
            }
            ,
            new Ext.Panel({
                region: "center",
                width: 492,
                padding: "31px",
                border: false,
                bodyStyle: " background-color: white ; ",
                items: [
                new Ext.form.ComboBox({
                    id: 'gtSearchCombobox',
                    queryParam: 'query',
                    store: ds,
                    displayField: 'label',
                    selectOnFocus: true,
                    minChars: 3,
                    typeAhead: false,
                    loadingText: gtLoadingText,
                    width: 450,
                    style: "border-color: " + JSONconf.bannerLineColor + ";",
                    pageSize: 0,
                    emptyText: gtEmptyTextSearch,
                    hideTrigger: true,
                    tpl: '<tpl for="."><div class="search-item" style="height: 28px;"><font color="#666666">{ld}</font> : {[values.label.replace(new RegExp( "(" +  Ext.get(\'gtSearchCombobox\').getValue()  + ")" , \'gi\' ), "<b>$1</b>" )]} <br></div></tpl>',
                    itemSelector: 'div.search-item',
                    listeners: {
                        'select': function(combo, record) {
                            var result = searchRecordSelectHandler(combo, record, app, JSONconf, glayerLocSel, northPart, eastPanel);
                            gfromWFSFlag = result.gfromWFSFlag;
                            gtyp = result.gtyp;
                            glab = result.glab;
                        },
                        scope: this
                    }
                })
                ]
            })
            ,
            new Ext.Panel({
                region: "center",
                style: "padding:31px 0px 0px; text-align: center;",
                width: 80,
                height: 67,
                border: false,
                padding: "7px",
                bodyStyle: {
                    backgroundColor: JSONconf.bannerLineColor
                },
                html: '<img style="vertical-align: middle;"src="theme/app/img/panel/search_button.png"/>'
            })
            ,
            {
                columnWidth: 0.5,
                html: "",
                height: 100,
                border: false
            }
            ,
            new Ext.Panel({
                region: "east",
                border: false,
                width: 200,
                height: 100,
                bodyStyle: " background-color: transparent; ",
                html: '<p style="text-align:right;padding: 15px;font-size:12px;"><a href="' + JSONconf.linkToCouncilWebsite + '" target="_blank">' + JSONconf.bannerRightCornerLine1 + '</a><br> ' + JSONconf.bannerRightCornerLine2 + ' <br><br>Map powered by <a href="http://www.pozi.com" target="_blank">Pozi</a></p>'

            })
            ]
        },
        {
            // HS MOD END
            region: "center",
            layout: "border",
            style: " background-color:white;padding:0px 10px 10px;",
            items: [
            {
                id: "centerpanel",
                xtype: "panel",
                layout: {
                    type: "vbox",
                    align: "stretch"
                },
                region: "center",
                border: false,
                items: [{
                    height: 29,
                    border: false,
                    bodyStyle: {
                        backgroundColor: JSONconf.bannerLineColor,
                        margin: '0px 0px 0px',
                        padding: '5px 8px',
                        fontSize: '16px',
                        fontFamily: 'tahoma,arial,verdana,sans-serif',
                        color: '#FFFFFF',
                        fontWeight: 'bolder'
                    },
                    defaults: {
                        bodyStyle: {
                            backgroundColor: JSONconf.bannerLineColor
                        },
                        border: false
                    },
                    layout: 'column',
                    items: [
                    {
                        html: '<div id="headerContainer">' + gtMapContexts + '</p></div>',
                        width: gtMapContextsSize
                    },
                    {
                        html: "<img src='theme/app/img/panel/list-white-final.png' style='padding:2px;' alt='Layers' title='Layers' />",
                        id: 'layerListButton',
                        width: 20,
                        hidden: JSONconf.hideLayerPanelButton,
                        listeners: {
                            render: function(c) {
                                // Expanding the drop down on click
                                c.el.on('click',
                                function() {
                                    if (westPanel.collapsed)
                                    {
                                        westPanel.expand();
                                    }
                                    else
                                    {
                                        westPanel.collapse();
                                    }
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
                        columnWidth: 1,
                        html: "",
                        height: 28
                    },
                    {
                        id: "toolPlaceHolder",
                        style: {
                            // Haven't bee able to find a configuration to replicate:
                            //  div align='right'
                            //
                            },
                        width: 25
                    }
                    ]
                },
                {
                    xtype: "panel",
                    layout: 'fit',
                    border: false,
                    flex: 1,
                    items: ["mymap"]
                }
                ]
            },
            westPanel,
            eastPanel
            ]
        }
        ];

        // Masking the north region
        if (JSONconf.hideNorthRegion)
        {
            portalItems = [portalItems[1]];
        }

        app = new gxp.Viewer({
            authorizedRoles: ['ROLE_ADMINISTRATOR'],
            proxy: gtProxy,
            //defaultSourceType: "gxp_wmscsource",
            portalConfig: {
                layout: "border",
                region: "center",
                // by configuring items here, we don't need to configure portalItems and save a wrapping container
                items: portalItems
            },
            // configuration of all tool plugins for this application
            tools: JSONconf.tools,
            // layer sources
            sources: JSONconf.sources,
            // map and layers
            map: {
                id: "mymap",
                // id needed to reference map in portalConfig above
                projection: "EPSG:900913",
                center: JSONconf.center,
                zoom: JSONconf.zoom,
                layers: JSONconf.layers,
                // Setting controls manually to have the simple OpenLayers zoom control
                controls: [
                new OpenLayers.Control.Navigation(),
                new OpenLayers.Control.Zoom(),
                new OpenLayers.Control.Attribution(),
                new OpenLayers.Control.ScaleLine()
                ],
                mapItems: [{
                    xtype: "gxp_scaleoverlay"
                }]
            }
        });

        app.on("ready", function() {
            // Setting the title of the map to print
            app.about = {};
            app.about["title"] = JSONconf.printMapTitle;

            // This is when we want to find the handle to the WFS layer
            for (x in app.mapPanel.layers.data.items) {
                var u = app.mapPanel.layers.data.items[x];
                if (u.data)
                {
                    // Assigning the selection layer to a global variable for easier access
                    if (u.data.name == "Selection")
                    {
                        glayerLocSel = u.getLayer();
                    }
                }
            };

            glayerLocSel.events.on({
                featuresadded: function(event) {
                    if (gfromWFSFlag == "Y")
                    {
                        var row_array = [];
                        var cont;
                        gComboDataArray = [];

                        for (var k = 0; k < this.features.length; k++)
                        {
                            // We capture the attributes brought back by the WFS call
                            cont = this.features[k].data;
                            // Capturing the feature as well (it contains the geometry)
                            cont["the_geom_WFS"] = this.features[k];

                            // If too long for the drop down, we truncate the string to the space remaining after "<LAYER NAME>:"
                            var num_char_in_drop_down = 38;
                            if (glab.length > num_char_in_drop_down - gtyp.length)
                            {
                                glab = glab.substring(0, num_char_in_drop_down - gtyp.length - 2) + "..";
                            }

                            // Building a record and inserting it into an array											
                            //row_array = new Array(k,typ,lab,cont,null,null,this.features[k].layer.protocol.featureType);
                            row_array = new Array(k, gtyp, cont, 0, glab, this.features[k].layer.protocol.featureType);
                            gComboDataArray.push(row_array);
                        }

                        // Clearing existing value from the drop-down list
                        var cb = Ext.getCmp('gtInfoCombobox');
                        cb.clearValue();

                        // If there is a record (and there should be at least one - by construction of the search table)
                        if (gComboDataArray.length)
                        {
                            if (cb.disabled) {
                                cb.enable();
                            }
                            gCombostore.removeAll();
                            gCombostore.loadData(gComboDataArray);
                            gComboDataArray = [];
                        }
                    }
                }
            });

            // If we have found a property to zoom to, well, zoom to and highlight it
            if (propertyDataInit)
            {
                var r = []; // should probably be {}
                r["data"] = propertyDataInit;
                var result = searchRecordSelectHandler(null, r, app, JSONconf, glayerLocSel, northPart, eastPanel);
                gfromWFSFlag = result.gfromWFSFlag;
                gtyp = result.gtyp;
                glab = result.glab;
            }

            // The main toolbar containing tools to be activated / deactivated on login/logout
            // TODO: determine if this is still relevant
            toolbar = app.mapPanel.toolbars[0];

            // Selecting the layer that the opacity slider will select
            var l_to_os;
            for (k in JSONconf.layers)
            {
                if (JSONconf.layers[k].displayInOpacitySlider)
                {
                    for (l in app.mapPanel.map.layers)
                    {
                        if (JSONconf.layers[k].title == app.mapPanel.map.layers[l].name)
                        {
                            l_to_os = app.mapPanel.map.layers[l];
                            break;
                        }
                    }
                }
            }

            if (l_to_os)
            {
                // Adding a label
                toolbar.items.add(new Ext.form.Label({
                    text: "Aerial Photo",
                    style: 'font: normal 13px verdana'
                }));

                // Adding a bit of space
                toolbar.items.add(new Ext.Toolbar.Spacer({
                    width: 8
                }));

                // Adding the eye-con
                toolbar.items.add(new Ext.Component({
                    html: '<img src="theme/app/img/panel/eye-con.png"/>'
                }));

                // Adding a bit of space
                toolbar.items.add(new Ext.Toolbar.Spacer({
                    width: 8
                }));

                // Adding an opacity slider to the toolbar
                var os = new GeoExt.LayerOpacitySlider({
                    layer: l_to_os,
                    aggressive: true,
                    width: 100
                });
                toolbar.items.add(os);

                // Rendering the toolbar
                toolbar.doLayout();
            }



            // Tree toolbar to add the login button to
            var westpaneltoolbar = Ext.getCmp('tree').getTopToolbar();
            westpaneltoolbar.addFill();
            westpaneltoolbar.items.add(new Ext.Button({
                id: "loginbutton"
            }));
            westpaneltoolbar.doLayout();

            // Login management via cookie and internal this.authorizedRoles variable
            // Variable and functions copied across from GeoExplorer' Composer.js:
            // https://github.com/opengeo/GeoExplorer/blob/master/app/static/script/app/GeoExplorer/Composer.js
            app.cookieParamName = 'geoexplorer-user';
            app.loginText = "Login";
            app.logoutText = "Logout, {user}";
            app.loginErrorText = "Invalid username or password.";
            app.saveErrorText = "Trouble saving: ";

            /** private: method[setCookieValue]
												 * Set the value for a cookie parameter
												 */
            app.setCookieValue = function(param, value) {
                document.cookie = param + '=' + escape(value);
            };

            /** private: method[clearCookieValue]
												 * Clear a certain cookie parameter.
												 */
            app.clearCookieValue = function(param) {
                document.cookie = param + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
            };

            /** private: method[getCookieValue]
												 * Get the value of a certain cookie parameter. Returns null if not found.
												 */
            app.getCookieValue = function(param) {
                var i,
                x,
                y,
                cookies = document.cookie.split(";");
                for (i = 0; i < cookies.length; i++) {
                    x = cookies[i].substr(0, cookies[i].indexOf("="));
                    y = cookies[i].substr(cookies[i].indexOf("=") + 1);
                    x = x.replace(/^\s+|\s+$/g, "");
                    if (x == param) {
                        return unescape(y);
                    }
                }
                return null;
            };

            /** private: method[logout]
												 * Log out the current user from the application.
												 */
            app.logout = function() {
                app.clearCookieValue("JSESSIONID");
                app.clearCookieValue(app.cookieParamName);
                app.setAuthorizedRoles([]);
                // This section became useless for tools which are actively monitoring the authorization status
                //toolbar.items.each(function(tool) {
                //	if (tool.needsAuthorization === true) {
                //		tool.disable();
                //	}
                //});
                app.showLogin();

                if (JSONconf.reloadOnLogin)
                {
                    // Issue with users having to refresh the page to access their priviledged functionalities
                    // This section should disappear when we're able to reload the layer tree / manager properly
                    window.location.reload();
                }
            };


            /** private: method[authenticate]
												 * Show the login dialog for the user to login.
												 */
            app.authenticate = function() {

                var submitLogin = function() {
                    panel.buttons[0].disable();

                    // Prefixes the username with the workspace name
                    win.hide();
                    var typedUsername = panel.getForm().items.items[0].getValue();
                    if (typedUsername != "admin")
                    {
                        panel.getForm().items.items[0].setValue(JSONconf.workspace + "." + typedUsername);
                    }
                    //
                    panel.getForm().submit({
                        success: function(form, action) {
                            toolbar.items.each(function(tool) {
                                if (tool.needsAuthorization === true) {
                                    tool.enable();
                                }
                            });
                            var user = form.findField('username').getValue();
                            app.setCookieValue(app.cookieParamName, user);
                            app.setAuthorizedRoles(["ROLE_ADMINISTRATOR"]);
                            // Reloading the layer tree (TODO)
                            ////Ext.getCmp('tree').body=null;
                            ////app.addLayers();
                            // Reloading the tabs
                            gCurrentLoggedRole = app.authorizedRoles[0];
                            loadTabConfig();
                            clear_highlight();
                            // Keeping username and password in variables for injection in WMS queries of local source
                            gLoggedUsername = form.findField('username').getValue();
                            gLoggedPassword = form.findField('password').getValue();
                            // Only showing the username without its workspace
                            var typedUsername = user;
                            if (user.split(".")[1])
                            {
                                typedUsername = user.split(".")[1];
                            }
                            app.showLogout(typedUsername);
                            win.un("beforedestroy", this.cancelAuthentication, this);
                            win.close();

                            if (JSONconf.reloadOnLogin) {
                                // Issue with users having to refresh the page to access their priviledged functionalities
                                // This section should disappear when we're able to reload the layer tree / manager properly
                                window.location.reload();
                            }
                        },
                        failure: function(form, action) {
                            // Reset the username to what was initially typed, and show the login window
                            panel.getForm().items.items[0].setValue(typedUsername);
                            win.show();
                            //
                            app.authorizedRoles = [];
                            panel.buttons[0].enable();
                            form.markInvalid({
                                "username": this.loginErrorText,
                                "password": this.loginErrorText
                            });
                        },
                        scope: this
                    });
                };

                var panel = new Ext.FormPanel({
                    url: gtLoginEndpoint,
                    frame: true,
                    labelWidth: 60,
                    defaultType: "textfield",
                    errorReader: {
                        read: function(response) {
                            var success = false;
                            var records = [];
                            if (response.status === 200) {
                                success = true;
                            } else {
                                records = [
                                {
                                    data: {
                                        id: "username",
                                        msg: app.loginErrorText
                                    }
                                },
                                {
                                    data: {
                                        id: "password",
                                        msg: app.loginErrorText
                                    }
                                }
                                ];
                            }
                            return {
                                success: success,
                                records: records
                            };
                        }
                    },
                    items: [{
                        fieldLabel: "Username",
                        name: "username",
                        allowBlank: false,
                        listeners: {
                            render: function() {
                                this.focus(true, 100);
                            }
                        }
                    },
                    {
                        fieldLabel: "Password",
                        name: "password",
                        inputType: "password",
                        allowBlank: false
                    }],
                    buttons: [{
                        text: app.loginText,
                        formBind: true,
                        handler: submitLogin,
                        scope: this
                    }],
                    keys: [{
                        key: [Ext.EventObject.ENTER],
                        handler: submitLogin,
                        scope: this
                    }]
                });

                var win = new Ext.Window({
                    title: app.loginText,
                    layout: "fit",
                    width: 235,
                    height: 130,
                    plain: true,
                    border: false,
                    modal: true,
                    items: [panel],
                    listeners: {
                        beforedestroy: this.cancelAuthentication,
                        scope: this
                    }
                });
                win.show();
            };

            /**
												 * private: method[applyLoginState]
												 * Attach a handler to the login button and set its text.
												 */
            app.applyLoginState = function(iconCls, text, handler, scope) {
                var loginButton = Ext.getCmp("loginbutton");
                loginButton.setIconClass(iconCls);
                loginButton.setText(text);
                loginButton.setHandler(handler, scope);
            };

            /** private: method[showLogin]
												 * Show the login button.
												 */
            app.showLogin = function() {
                var text = app.loginText;
                var handler = app.authenticate;
                app.applyLoginState('login', text, handler, this);
            };

            /** private: method[showLogout]
												 * Show the logout button.
												 */
            app.showLogout = function(user) {
                var text = new Ext.Template(this.logoutText).applyTemplate({
                    user: user
                });
                var handler = app.logout;
                app.applyLoginState('logout', text, handler, this);
            };

            app.authorizedRoles = [];
            if (app.authorizedRoles) {
                // If there is a cookie, the user is authorized
                var user = app.getCookieValue(app.cookieParamName);
                if (user !== null) {
                    app.setAuthorizedRoles(["ROLE_ADMINISTRATOR"]);
                    gCurrentLoggedRole = app.authorizedRoles[0];
                }

                // unauthorized, show login button
                if (app.authorizedRoles.length === 0) {
                    app.showLogin();
                } else {
                    var user = app.getCookieValue(app.cookieParamName);
                    if (user === null) {
                        user = "unknown";
                    }
                    // Only showing the username without its workspace
                    var typedUsername = user;
                    if (user.split(".")[1])
                    {
                        typedUsername = user.split(".")[1];
                    }
                    app.showLogout(typedUsername);
                    // Showing the layer tree because we're logged in
                    westPanel.expand();

                    if (app.authorizedRoles[0])
                    {
                        gCurrentLoggedRole = app.authorizedRoles[0];
                    }

                }
            };


            var loadTabConfig = function() {

                // Information panel layouts for the current authorized role - we should degrade nicely if the service is not found
                var ds;
                for (urlIdx in JSONconf.liveDataEndPoints)
                {
                    if (JSONconf.liveDataEndPoints.hasOwnProperty(urlIdx))
                    {
                        ds = new Ext.data.Store({
                            autoLoad: true,
                            proxy: new Ext.data.ScriptTagProxy({
                                url: JSONconf.liveDataEndPoints[urlIdx].urlLayout
                            }),
                            reader: new Ext.data.JsonReader({
                                root: 'rows',
                                totalProperty: 'total_rows',
                                id: 'key_arr'
                            },
                            [{
                                name: 'key_arr',
                                mapping: 'row.key_arr'
                            }
                            ]),
                            baseParams: {
                                role: gCurrentLoggedRole,
                                mode: JSONconf.liveDataEndPoints[urlIdx].storeMode,
                                config: JSONconf.liveDataEndPoints[urlIdx].storeName
                            },
                            listeners:
                            {
                                load: function(store, recs)
                                {
                                    // Setting up a global variable array to define the info panel layouts
                                    for (key = 0; key < recs.length; key++)
                                    {
                                        var a = recs[key].json.row.val_arr;

                                        if (gLayoutsArr[recs[key].json.row.key_arr])
                                        {
                                            // If this key (layer) already exists, we add the JSON element (tab) to its value (tab array)
                                            gLayoutsArr[recs[key].json.row.key_arr] = gLayoutsArr[recs[key].json.row.key_arr].concat(a);
                                            // Reordering the array elements inside the array for this key, according to orderNum
                                            gLayoutsArr[recs[key].json.row.key_arr].sort(function(a, b) {
                                                return parseInt(a.orderNum) - parseInt(b.orderNum);
                                            });
                                        }
                                        else
                                        {
                                            // We create this key if it didn't exist
                                            gLayoutsArr[recs[key].json.row.key_arr] = a;
                                        }
                                    }

                                    add_default_tabs();
                                }
                            }
                        });
                    }
                };
            };

            // Loading the tabs on initial page load
            loadTabConfig();

        });

    };

    // Loading the extra Javascript if the configuration file contains a name
    if (JSONconf.customJS)
    {
        loadJSFile('lib/custom/js/' + JSONconf.customJS, extraJSScriptLoaded);
    }
    else
    {
        extraJSScriptLoaded();
    }

};

