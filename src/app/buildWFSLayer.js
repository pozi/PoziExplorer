buildWFSLayer = function(JSONconf) {

    return {
        source: "ol",
        visibility: true,
        type: "OpenLayers.Layer.Vector",
        group: "top",
        args: [
            "Selection",
            {
                styleMap: function() {
                    // WFS layer: style , definition , namespaces
                    var styleMap = new OpenLayers.StyleMap();
                    styleMap.styles["default"].addRules([
                        new OpenLayers.Rule({
                            symbolizer: JSONconf.highlightSymboliser,
                            elseFilter: true,
                            title: " "
                        })
                    ]);
                    return styleMap;
                }(),
                projection: new OpenLayers.Projection("EPSG:4326")
            }
        ]
    };

};

