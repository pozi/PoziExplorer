requestConfig = function(options) {	

    var configScript = Ext.urlDecode(location.search.substr(1))['config'];
    // Here are the optional arguments that can be extracted from the query string
    // At the moment, we only use the property number, passed using the "property" attribute
    var propNum = Ext.urlDecode(location.search.substr(1))['property'];

    // If not in query string, extract from url like: http://www.pozi.com/clientname?property=45633
    if (!configScript) {
        var match = location.href.match(/.*\/([^\?]*)/);
        if (match) { configScript = match[1]; }
    }

    // If still no config script, then assume it's in the subdomain
    if (!configScript) {
        configScript = location.hostname.split(".")[0];
    }

    // Loading the JSON configuration based on the council name
    OpenLayers.Request.GET({
        url: "lib/custom/json/" + configScript + ".json",
        success: function(request) {

            var defaultConf = {
                servicesHost: "http://s1.pozi.com",
                searchEndPoint: "/ws/rest/v3/ws_all_features_by_string_and_lga.php",
                WFSEndPoint: "/geoserver/wfs",
                LGACode: "346",
                workspace: "",
                highlightSymboliser: {
                    name: "test",
                    strokeColor: "yellow",
                    strokeWidth: 15,
                    strokeOpacity: 0.5,
                    fillColor: "yellow",
                    fillOpacity: 0.2
                },
                logoClientSrc: "theme/app/img/custom/mitchell_logo.jpg",
                zoomMax: 18,
                bannerLineColor: "#7a7a7a",
                bannerRightCornerLine1: "Mitchell Shire Council",
                bannerRightCornerLine2: "Victoria, Australia",
                printMapTitle: "",
                linkToCouncilWebsite: "http://www.mitchellshire.vic.gov.au/",
                quickZoomDatastore: [],
                collapseWestPanel: false,
                hideNorthRegion: false,
                hideSelectedFeaturePanel: false,
                eastPanelCollapsed: false,
                hideLayerPanelButton: false,
                mapContexts: [{
                    name: "Property Map",
                    size: 120
                }],
                reloadOnLogin: false,
                openFirstDefaultTab: false,
                databaseConfig: "basemap", // Datastore definition for the web service search results
                layerPresentation: {},
                WFSsrsName: "EPSG:4326",
                WFSgeometryName: "the_geom",
                FeatureNS: "http://www.pozi.com/vicmap_classic",
                emptyTextSearch: 'Find address, road, feature, etc...',
                loadingText: "Loading ...",
                detailsTitle: "Details",
                emptyTextSelectFeature: "Selected feature ..."
                
            };

            var loadedConf = Ext.util.JSON.decode(request.responseText);
            var JSONconf = {}
            Ext.apply(JSONconf, loadedConf, defaultConf)

            // This is complicated because layerPresentation needs a deep merge
            var layerPresentationDefaults = {
                // This structure deals with fields to show, in which order and with which name
                "VICMAP_PROPERTY_ADDRESS": [
                    { attr_name: "ezi_add", alt_name: "Address" },            
                    { attr_name: "locality" },
                    { attr_name: "postcode" },
                    { attr_name: "pr_propnum", alt_name: "Property Number" }
                ]
            };
            JSONconf.layerPresentation = Ext.apply({}, JSONconf.layerPresentation, layerPresentationDefaults);

            // This is environment config - dev vs prod
            var debugMode = (/(localhost|\.dev|\.local)/i).test(window.location.hostname);
            var localLayerSourcePrefix,localPrintServicePrefix;
            if (debugMode) {
                JSONconf.proxy = "proxy/?url=";
                // To be able to login to v3 from the debug environment
                JSONconf.loginEndpoint = "http://v3.pozi.com/geoexplorer/login/";
                localLayerSourcePrefix = "http://v3.pozi.com";
                JSONconf.localPrintServicePrefix = "http://v3.pozi.com";
            } else {
                JSONconf.proxy = "/geoserver/rest/proxy?url=";
                JSONconf.loginEndpoint = "/geoexplorer/login";
                localLayerSourcePrefix = "";
                JSONconf.localPrintServicePrefix = "";
            }
            // Fixing local URL source for debug mode
            if (JSONconf.sources.local) {
                JSONconf.sources.local.url = localLayerSourcePrefix + JSONconf.sources.local.url;
            }

            // Fixing local print service for debug mode
            _(JSONconf.tools).each(function(t){
                if (t.ptype == "gxp_print")
                {
                    t.printService = JSONconf.localPrintServicePrefix + t.printService;
                }
            });

            if (propNum) {
                var ds = new Ext.data.JsonStore({
                    autoLoad: true,
                    root: 'rows',
                    baseParams: {
                        query: propNum,
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
                        url: JSONconf.servicesHost + "/ws/rest/v3/ws_property_id_by_propnum.php"
                    }),
                    listeners: {
                        load: function(request) {
                            if (request.data && request.data.items[0]) {
                                var propertyDataInit = request.data.items[0].json.row; // property record
                            } else {
                                alert("No property found in " + helpers.toTitleCase(configScript) + " with number: " + propNum + ".");
                            }

                            options.onLoad(JSONconf, propertyDataInit);
                        }
                    }
                });

            } else {
                options.onLoad(JSONconf);
            }
        },
        failure: function(request) { alert("Configuration data could not be loaded!"); },
        scope: this
    });
};

