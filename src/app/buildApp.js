buildApp = function(portalItems, JSONconf, doClearHighlight, gCombostore, addDefaultTabs, accordion, gLayoutsArr, northPart, gCurrentLoggedRole, loadTabConfig, buildWFSLayer) {

    var app = new gxp.Viewer({
        authorizedRoles: ['ROLE_ADMINISTRATOR'],
        proxy: JSONconf.proxy,
        defaultSourceType: "gxp_wmscsource",
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
            scales: JSONconf.scales,
            center: JSONconf.center,
            zoom: JSONconf.zoom,
            layers: _.union(JSONconf.layers, [buildWFSLayer(JSONconf)]),
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

    // Setting the title of the map to print
    app.about = { title: JSONconf.printMapTitle };

    app.getLayerByName = function(name) {
        return _(app.mapPanel.map.layers).find(function(layer) {
            return layer.name === name;
        });
    };

    app.getSelectionLayer = function() {
        return app.getLayerByName("Selection");
    };

    app.getWMSLayerByName = function(name) { // Gets the layer as an OpenLayers.Layer.WMS object
        return _(app.mapPanel.layers.data.map).chain()
            .values()
            .find(function(layer) { 
                var nameWithWorkspace = layer.get('name');
                var nameWithoutWorkspace = _(String(nameWithWorkspace).split(':')).last();
                return nameWithoutWorkspace === name;
            })
            .value();
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

    app.clearHighlightWithCollapse = function() {
      doClearHighlight(app, gCombostore, addDefaultTabs, accordion, gLayoutsArr, JSONconf, northPart, true);
    }

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

        var win;
        var panel;

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

                    // Only showing the username without its workspace
                    var typedUsername = user;
                    if (user.split(".")[1]) {
                        typedUsername = user.split(".")[1];
                    }
                    app.showLogout(typedUsername);

                    // Reloading the tabs
                    gCurrentLoggedRole.value = typedUsername;
                    loadTabConfig(JSONconf, gCurrentLoggedRole, gLayoutsArr, addDefaultTabs, accordion);
                    app.clearHighlightWithCollapse();

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

        panel = new Ext.FormPanel({
            url: JSONconf.loginEndpoint,
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

        win = new Ext.Window({
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

    return app;

};

