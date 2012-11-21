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
        gfromWFSFlag.value = "N";

        // Pushing the WFS layer in the layer store
        JSONconf.layers.push(buildWFSLayer(JSONconf));

        // Store behind the info drop-down list
        gCombostore = buildComboStore();

        // Panels and portals
        westPanel = buildWestPanel(JSONconf);

        var tabExpand = buildTabExpand(gtLayerLabel, gCurrentExpandedTabIdx, gLayoutsArr, JSONconf, gLoggedRole, helpers);

        northPart = buildNorthPart(JSONconf, gCombostore, gfromWFSFlag, helpers, tabExpand, gLayoutsArr, gCurrentExpandedTabIdx);

        var accordion = buildAccordion(gtLayerLabel, gCurrentExpandedTabIdx, gLayoutsArr, tabExpand);

        var eastPanel = buildEastPanel(JSONconf, northPart, accordion);

        var portalItems = buildPortalItems(JSONconf, buildAllFeaturesDataStore, searchRecordSelectHandler, gfromWFSFlag, gtyp, glab, westPanel, eastPanel);

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

                    if (gfromWFSFlag.value == "Y") {
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
                            if (glab.value.length > num_char_in_drop_down - gtyp.value.length) {
                                glab.value = glab.value.substring(0, num_char_in_drop_down - gtyp.value.length - 2) + "..";
                            }

                            // Building a record and inserting it into an array											
                            //row_array = new Array(k,typ,lab,cont,null,null,this.features[k].layer.protocol.featureType);
                            row_array = new Array(k, gtyp.value, cont, 0, glab.value, this.features[k].layer.protocol.featureType);
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
                gfromWFSFlag.value = result.gfromWFSFlagValue;
                gtyp.value = result.gtyp;
                glab.value = result.glab;
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
                            app.getToolbar().items.each(function(tool) {
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

