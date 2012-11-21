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

        var tabExpand = buildTabExpand(gtLayerLabel, gCurrentExpandedTabIdx, gLayoutsArr, JSONconf, gCurrentLoggedRole, helpers);

        northPart = buildNorthPart(JSONconf, gCombostore, gfromWFSFlag, helpers, tabExpand, gLayoutsArr, gCurrentExpandedTabIdx);

        var accordion = buildAccordion(gtLayerLabel, gCurrentExpandedTabIdx, gLayoutsArr, tabExpand);

        eastPanel = buildEastPanel(JSONconf, northPart, accordion);

        var portalItems = buildPortalItems(JSONconf, buildAllFeaturesDataStore, searchRecordSelectHandler, gfromWFSFlag, gtyp, glab, westPanel, eastPanel);

        app = buildApp(gtProxy, portalItems, JSONconf, doClearHighlight, gCombostore, addDefaultTabs, accordion, gLayoutsArr, northPart,
                       gCurrentLoggedRole, loadTabConfig, gtLoginEndpoint);

        app.on("ready", function() {

            app.getSelectionLayer().events.on({ featuresadded: buildFeaturesAddedHandler(gfromWFSFlag, gComboDataArray, glab, gtyp, gCombostore) });

            // If we have found a property to zoom to, well, zoom to and highlight it
            if (propertyDataInit) {
                var r = []; // should probably be {}
                r["data"] = propertyDataInit;
                searchRecordSelectHandler(null, r, app, JSONconf, northPart, eastPanel, gfromWFSFlag, gtyp, glab);
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


            app.authorizedRoles = [];
            if (app.authorizedRoles) {
                // If there is a cookie, the user is authorized
                var user = app.getCookieValue(app.cookieParamName);
                if (user !== null) {
                    app.setAuthorizedRoles(["ROLE_ADMINISTRATOR"]);
                    gCurrentLoggedRole.value = app.authorizedRoles[0];
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
                        gCurrentLoggedRole.value = app.authorizedRoles[0];
                    }

                }
            };

            // Loading the tabs on initial page load
            loadTabConfig(JSONconf, gCurrentLoggedRole, gLayoutsArr, addDefaultTabs, accordion);

        });

    };

    // Loading the extra Javascript if the configuration file contains a name
    if (JSONconf.customJS) {
        loadJSFile('lib/custom/js/' + JSONconf.customJS, extraJSScriptLoaded);
    } else {
        extraJSScriptLoaded();
    }

};

