// Override of of layer manager

gxp.plugins.LayerManager.prototype.configureLayerNode = function(loader, attr) {
    gxp.plugins.LayerManager.superclass.configureLayerNode.apply(this, arguments);
    var legendXType;
    // add a WMS legend to each node created
    if (OpenLayers.Layer.WMS && attr.layer instanceof OpenLayers.Layer.WMS) {
        legendXType = "gx_wmslegend";
    } else if (OpenLayers.Layer.Vector && attr.layer instanceof OpenLayers.Layer.Vector) {
        legendXType = "gx_vectorlegend";
    }
    if (legendXType) {
        console.log('In layer manager override');
        Ext.apply(attr, {
            component: {
                xtype: legendXType,
                // TODO these baseParams were only tested with GeoServer,
                // so maybe they should be configurable - and they are
                // only relevant for gx_wmslegend.
                baseParams: {
                    transparent: true,
                    format: "image/png",
                    legend_options: "fontAntiAliasing:true;fontSize:11;fontName:Arial;forceLabels:on"
                },
                layerRecord: this.target.mapPanel.layers.getByLayer(attr.layer),
                showTitle: false,
                // custom class for css positioning
                // see tree-legend.html
                cls: "legend"
            }
        });
    }
};
