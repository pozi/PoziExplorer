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
                strategies: [new OpenLayers.Strategy.BBOX({
                    ratio: 100
                })],
                protocol: new OpenLayers.Protocol.WFS({
                    version: "1.1.0",
                    url: JSONconf.servicesHost + JSONconf.WFSEndPoint,
                    featureType: JSONconf.propertyLayerWS,
                    srsName: JSONconf.WFSsrsName,
                    featureNS: JSONconf.FeatureNS,
                    geometryName: JSONconf.WFSgeometryName,
                    schema: JSONconf.servicesHost + JSONconf.WFSEndPoint + "?service=WFS&version=1.1.0&request=DescribeFeatureType&TypeName=" + JSONconf.propertyLayerWS + ":" + JSONconf.propertyLayerName
                }),
                filter: new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                    property: 'pr_propnum',
                    value: -1
                }),
                projection: new OpenLayers.Projection("EPSG:4326")
            }
        ]
    };

};

