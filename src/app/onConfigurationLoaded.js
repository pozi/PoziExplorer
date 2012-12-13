// Function to execute on successful return of the JSON configuration file loading
var onConfigurationLoaded = function(JSONconf, propertyDataInit) { // AND GLOBALS INCLUDING: gCombostore, westPanel, northPart, eastPanel, app

    // Encapsulating the loading of the main app in a callback
    var extraJSScriptLoaded = function() {
        var tabExpand;
        var accordion;
        var portalItems;
        var gLayoutsArr;

        gLayoutsArr = []; // Layout for the extra tabs
        gfromWFSFlag.value = "N"; // Flag to track the origin of the store refresh

        gCombostore = buildComboStore(); // Store behind the info drop-down list
        westPanel = buildWestPanel(JSONconf);
        tabExpand = buildTabExpand(gtLayerLabel, gCurrentExpandedTabIdx, gLayoutsArr, JSONconf, gCurrentLoggedRole, helpers);
	tabCollapse = buildTabCollapse(gtLayerLabel, gCurrentExpandedTabIdx, gLayoutsArr);
        northPart = buildNorthPart(JSONconf, gCombostore, gfromWFSFlag, helpers, tabExpand, gLayoutsArr, gCurrentExpandedTabIdx);
        accordion = buildAccordion(gtLayerLabel, gCurrentExpandedTabIdx, gLayoutsArr, tabExpand);
        eastPanel = buildEastPanel(JSONconf, northPart, accordion);
        portalItems = buildPortalItems(JSONconf, buildAllFeaturesDataStore, searchRecordSelectHandler, gfromWFSFlag, gtyp, glab, westPanel, eastPanel);
        app = buildApp(portalItems, JSONconf, doClearHighlight, gCombostore, addDefaultTabs, accordion, gLayoutsArr, northPart, gCurrentLoggedRole, loadTabConfig, buildWFSLayer);

        app.on("ready", function() {
            app.getSelectionLayer().events.on({ featuresadded: buildFeaturesAddedHandler(gfromWFSFlag, gComboDataArray, glab, gtyp, gCombostore) });

            searchRecordSelectHandler(null, { data: propertyDataInit }, app, JSONconf, northPart, eastPanel, gfromWFSFlag, gtyp, glab);
            addOpacitySlider(app);

            // Tree toolbar to add the login button to
            var westpaneltoolbar = Ext.getCmp('tree').getTopToolbar();
            westpaneltoolbar.addFill();
            westpaneltoolbar.items.add(new Ext.Button({ id: "loginbutton" }));
            westpaneltoolbar.doLayout();

            initAuthorization(app, gCurrentLoggedRole, westPanel);

            // Loading the tabs on initial page load
            loadTabConfig(JSONconf, gCurrentLoggedRole, gLayoutsArr, addDefaultTabs, accordion, propertyDataInit);
        });

    };

    // Loading the extra Javascript if the configuration file contains a name
    if (JSONconf.customJS) {
        loadJSFile('lib/custom/js/' + JSONconf.customJS, extraJSScriptLoaded);
    } else {
        extraJSScriptLoaded();
    }

};

