// Function to execute on successful return of the JSON configuration file loading
var onConfigurationLoaded = function(JSONconf, propertyDataInit) {

    // Encapsulating the loading of the main app in a callback
    var extraJSScriptLoaded = function() {

        // Fixing local URL source for debug mode
        if (JSONconf.sources.local) {
            JSONconf.sources.local.url = gtLocalLayerSourcePrefix + JSONconf.sources.local.url;
        }


        // Layout for the extra tabs
        gLayoutsArr = [];

        // Flag to track the origin of the store refresh
        var gfromWFSFlag = "N";

        // Pushing the WFS layer in the layer store
        JSONconf.layers.push(buildWFSLayer(JSONconf));

        // Store behind the info drop-down list
        gCombostore = buildComboStore();


        // Panels and portals
        westPanel = buildWestPanel(JSONconf);

        var tabExpand = buildTabExpand(gtLayerLabel, gCurrentExpandedTabIdx, gLayoutsArr, JSONconf, gLoggedRole, helpers);

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
                                    gfromWFSFlag = "N";
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

        var accordion = buildAccordion(gtLayerLabel, gCurrentExpandedTabIdx, gLayoutsArr, tabExpand);

        var bottomEastItem = {
            border: false
        };
        if (JSONconf.bottomEastItem) {
            bottomEastItem = {
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
                    for (i in p.items.items) {
                        // hasOwnProperty appropriate way to deal with direct property of this object, not inherited ones
                        // In the case on an array, direct members are indexes
                        if (p.items.items.hasOwnProperty(i)) {
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
                items: [
                    new Ext.BoxComponent({
                        region: "west",
                        width: JSONconf.logoClientWidth,
                        bodyStyle: " background-color: transparent ",
                        html: '<img style="height: 90px" src="' + JSONconf.logoClientSrc + '" align="right"/>'
                    }),
                    {
                        columnWidth: 0.5,
                        html: "",
                        height: 100,
                        border: false
                    },
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
                            store: buildAllFeaturesDataStore(JSONconf),
                            displayField: 'label',
                            selectOnFocus: true,
                            minChars: 3,
                            typeAhead: false,
                            loadingText: JSONconf.loadingText,
                            width: 450,
                            style: "border-color: " + JSONconf.bannerLineColor + ";",
                            pageSize: 0,
                            emptyText: JSONconf.emptyTextSearch,
                            hideTrigger: true,
                            tpl: '<tpl for="."><div class="search-item" style="height: 28px;"><font color="#666666">{ld}</font> : {[values.label.replace(new RegExp( "(" +  Ext.get(\'gtSearchCombobox\').getValue()  + ")" , \'gi\' ), "<b>$1</b>" )]} <br></div></tpl>',
                            itemSelector: 'div.search-item',
                            listeners: {
                                'select': function(combo, record) {
                                    var result = searchRecordSelectHandler(combo, record, app, JSONconf, northPart, eastPanel);
                                    gfromWFSFlag = result.gfromWFSFlag;
                                    gtyp = result.gtyp;
                                    glab = result.glab;
                                },
                                scope: this
                            }
                        })
                        ]
                    }),
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
                    }),
                    {
                        columnWidth: 0.5,
                        html: "",
                        height: 100,
                        border: false
                    },
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
                        items: [
                            {
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
                                    function() {
                                        var mapContextsSize = function() {
                                            return (JSONconf.mapContexts.length === 0) ? 0 : JSONconf.mapContexts[0].size;
                                        };
                                        var mapContexts = function() {
                                            return (JSONconf.mapContexts.length === 0) ? "&nbsp;" : JSONconf.mapContexts[0].name;
                                        };
                                        // TODO: format the contexts into a drop down loading different layers if more than 1.
                                        return {
                                            html: '<div id="headerContainer">' + mapContexts() + '</p></div>',
                                            width: mapContextsSize()
                                        };
                                    }(),
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
                                                        if (westPanel.collapsed) {
                                                            westPanel.expand();
                                                        } else {
                                                            westPanel.collapse();
                                                        }
                                                    }
                                                );
                                                // Using the pointer cursor when hovering over the element
                                                c.el.on('mouseover',
                                                    function() {
                                                        this.dom.style.cursor = 'pointer';
                                                    }
                                                );
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
        if (JSONconf.hideNorthRegion) {
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

        app.getLayerByName = function(name) {
            return _(app.mapPanel.map.layers).find(function(layer) {
                return layer.name === name;
            });
        };

        app.getSelectionLayer = function() {
            return app.getLayerByName("Selection");
        };

        app.getLayerForOpacitySlider = function() {
            var layerConfForOpacitySlider = _(JSONconf.layers).find(function(layerConf) { 
                return layerConf.displayInOpacitySlider; 
            });
            if (layerConfForOpacitySlider) {
                return app.getLayerByName(layerConfForOpacitySlider.title);
            }
        };

        app.getToolbar = function() {
            // The main toolbar containing tools to be activated / deactivated on login/logout
            // TODO: determine if this is still relevant
            return app.mapPanel.toolbars[0];
        };

        app.clearHighlight = function() {
          doClearHighlight(app, gCombostore, addDefaultTabs, accordion, gLayoutsArr, JSONconf, northPart);
        }

        app.on("ready", function() {
            // Setting the title of the map to print
            app.about = {};
            app.about["title"] = JSONconf.printMapTitle;

            app.getSelectionLayer().events.on({
                featuresadded: function(event) {

                    if (gfromWFSFlag == "Y") {
                        var row_array = [];
                        var cont;
                        gComboDataArray = [];

                        for (var k = 0; k < this.features.length; k++) {

                            // We capture the attributes brought back by the WFS call
                            cont = this.features[k].data;
                            // Capturing the feature as well (it contains the geometry)
                            cont["the_geom_WFS"] = this.features[k];

                            // If too long for the drop down, we truncate the string to the space remaining after "<LAYER NAME>:"
                            var num_char_in_drop_down = 38;
                            if (glab.length > num_char_in_drop_down - gtyp.length) {
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
                        if (gComboDataArray.length) {
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
            if (propertyDataInit) {
                var r = []; // should probably be {}
                r["data"] = propertyDataInit;
                var result = searchRecordSelectHandler(null, r, app, JSONconf, northPart, eastPanel);
                gfromWFSFlag = result.gfromWFSFlag;
                gtyp = result.gtyp;
                glab = result.glab;
            }

            // Selecting the layer that the opacity slider will select

            if (app.getLayerForOpacitySlider()) {
                // Adding a label
                app.getToolbar().items.add(new Ext.form.Label({
                    text: "Aerial Photo",
                    style: 'font: normal 13px verdana'
                }));

                // Adding a bit of space
                app.getToolbar().items.add(new Ext.Toolbar.Spacer({
                    width: 8
                }));

                // Adding the eye-con
                app.getToolbar().items.add(new Ext.Component({
                    html: '<img src="theme/app/img/panel/eye-con.png"/>'
                }));

                // Adding a bit of space
                app.getToolbar().items.add(new Ext.Toolbar.Spacer({
                    width: 8
                }));

                // Adding an opacity slider to the toolbar
                var os = new GeoExt.LayerOpacitySlider({
                    layer: app.getLayerForOpacitySlider(),
                    aggressive: true,
                    width: 100,
                    changeVisibility: true
                });
                app.getToolbar().items.add(os);

                // Rendering the toolbar
                app.getToolbar().doLayout();
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
                app.showLogin();

                if (JSONconf.reloadOnLogin) {
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
                    if (typedUsername != "admin") {
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
                            gLoggedRole['current'] = app.authorizedRoles[0];
                            loadTabConfig();
                            app.clearHighlight();
                            // Keeping username and password in variables for injection in WMS queries of local source
                            gLoggedUsername = form.findField('username').getValue();
                            gLoggedPassword = form.findField('password').getValue();
                            // Only showing the username without its workspace
                            var typedUsername = user;
                            if (user.split(".")[1]) {
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
                                    { data: { id: "username", msg: app.loginErrorText } },
                                    { data: { id: "password", msg: app.loginErrorText } }
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
                    gLoggedRole['current'] = app.authorizedRoles[0];
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
                    if (user.split(".")[1]) {
                        typedUsername = user.split(".")[1];
                    }
                    app.showLogout(typedUsername);
                    // Showing the layer tree because we're logged in
                    westPanel.expand();

                    if (app.authorizedRoles[0]) {
                        gLoggedRole['current'] = app.authorizedRoles[0];
                    }

                }
            };


            var loadTabConfig = function() {

                // Information panel layouts for the current authorized role - we should degrade nicely if the service is not found
                _(JSONconf.liveDataEndPoints).each(function(endPoint) {
                    new Ext.data.Store({
                        autoLoad: true,
                        proxy: new Ext.data.ScriptTagProxy({
                            url: endPoint.urlLayout
                        }),
                        reader: new Ext.data.JsonReader(
                            {
                                root: 'rows',
                                totalProperty: 'total_rows',
                                id: 'key_arr'
                            },
                            [ { name: 'key_arr', mapping: 'row.key_arr' } ]
                        ),
                        baseParams: {
                            role: gLoggedRole['current'],
                            mode: endPoint.storeMode,
                            config: endPoint.storeName
                        },
                        listeners: {
                            load: function(store, recs) {
                                // Setting up a global variable array to define the info panel layouts
                                for (key = 0; key < recs.length; key++) {
                                    var a = recs[key].json.row.val_arr;

                                    if (gLayoutsArr[recs[key].json.row.key_arr]) {
                                        // If this key (layer) already exists, we add the JSON element (tab) to its value (tab array)
                                        gLayoutsArr[recs[key].json.row.key_arr] = gLayoutsArr[recs[key].json.row.key_arr].concat(a);
                                        // Reordering the array elements inside the array for this key, according to orderNum
                                        gLayoutsArr[recs[key].json.row.key_arr].sort(function(a, b) {
                                            return parseInt(a.orderNum) - parseInt(b.orderNum);
                                        });
                                    } else {
                                        // We create this key if it didn't exist
                                        gLayoutsArr[recs[key].json.row.key_arr] = a;
                                    }
                                }

                                addDefaultTabs(accordion, gLayoutsArr, JSONconf);
                            }
                        }
                    });
                });
            };

            // Loading the tabs on initial page load
            loadTabConfig();

        });

    };

    // Loading the extra Javascript if the configuration file contains a name
    if (JSONconf.customJS) {
        loadJSFile('lib/custom/js/' + JSONconf.customJS, extraJSScriptLoaded);
    } else {
        extraJSScriptLoaded();
    }

};

