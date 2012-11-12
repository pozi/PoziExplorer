function requestConfig() {	

    var configScript = Ext.urlDecode(location.search.substr(1))['config'];
    var propNum = Ext.urlDecode(location.search.substr(1))['property'];

    // If the URL does not offer itself to splitting according to the rules above, it means, we are having Apache clean URL: http://www.pozi.com/mitchell/property/45633
    // We extract the information according to this pattern
    if (! (configScript))
    {
        // We extract the end of the URL
        // This will no longer work when we consider saved maps
        var urlquery = location.href.split("/");
        if (urlquery[urlquery.length - 2])
        {
            if (urlquery[urlquery.length - 2] == "property")
            {
                configScript = urlquery[urlquery.length - 3];
                propNum = urlquery[urlquery.length - 1];
            }
            else
            {
                configScript = urlquery[urlquery.length - 1];
            }
        }
    }
   
    // Loading the JSON configuration based on the council name
    OpenLayers.Request.GET({
        url: "lib/custom/json/" + configScript + ".json",
        success: function(request) {
            // Decoding the configuration file - it's a JSON file
            JSONconf = Ext.util.JSON.decode(request.responseText);
            // If a property number has been passed
            if (propNum)
            {
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
                                propertyDataInit = request.data.items[0].json.row; // property record
                            } else {
                                alert("No property found in " + toTitleCase(configScript) + " with number: " + propNum + ".");
                            }

                            onConfigurationLoaded();
                        }
                    }
                });
            }
            else
            {
                onConfigurationLoaded();
            }
        },
        failure: function(request) { alert("Configuration data could not be loaded!"); },
        scope: this
    });
};
