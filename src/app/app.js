/**
 * Add all your dependencies here.
 *
 * @require widgets/Viewer.js
 * @require plugins/LayerManager.js
 * @require plugins/OLSource.js
 * @require plugins/OSMSource.js
 * @require plugins/BingSource.js
 * @require plugins/GoogleSource.js
 * @require plugins/WMSCSource.js
 * @require plugins/MapQuestSource.js
 * @require plugins/Zoom.js
 * @require plugins/ZoomToLayerExtent.js
 * @require plugins/AddLayers.js
 * @require plugins/RemoveLayer.js
 * @require plugins/WMSGetFeatureInfo.js
 * @require plugins/Print.js
 * @require plugins/LayerProperties.js
 * @require plugins/Measure.js
 * @require plugins/FeatureEditor.js 
 * @require plugins/FeatureManager.js 
 * @require plugins/Styler.js 
 * @require widgets/WMSLayerPanel.js
 * @require widgets/ScaleOverlay.js
 * @require RowExpander.js
 * @require RowLayout.js
 * @require GeoExt/widgets/PrintMapPanel.js
 * @require GeoExt/widgets/LayerOpacitySlider.js
 * @require GeoExt/plugins/PrintProviderField.js
 * @require GeoExt/plugins/PrintPageField.js
 * @require GeoExt/plugins/PrintExtent.js
 * @require OpenLayers/Layer.js
 * @require OpenLayers/Handler/Path.js
 * @require OpenLayers/Handler/Point.js
 * @require OpenLayers/Handler/Polygon.js
 * @require OpenLayers/Renderer.js
 * @require OpenLayers/Renderer/SVG.js 
 * @require OpenLayers/Renderer/VML.js 
 * @require OpenLayers/Renderer/Canvas.js 
 * @require OpenLayers/StyleMap.js
 * @require OpenLayers/Feature/Vector.js
 * @require OpenLayers/Console.js
 * @require OpenLayers/Lang.js 
 * @require OpenLayers/Layer/Vector.js
 * @require OpenLayers/Layer/OSM.js
 * @require OpenLayers/Control/ScaleLine.js
 * @require OpenLayers/Control/Zoom.js
 * @require OpenLayers/Projection.js
 * @require PrintPreview.js
 * @require OpenLayers/StyleMap.js
 * @require OpenLayers/Strategy.js
 * @require OpenLayers/Strategy/BBOX.js
 * @require OpenLayers/Protocol.js
 * @require OpenLayers/Protocol/WFS.js
 * @require OpenLayers/Filter.js
 * @require OpenLayers/Filter/Comparison.js
 * @require OpenLayers/Request/XMLHttpRequest.js
 *
 * @require underscore.js
 *
 * @require overrides/ext/widgets/grid/PropertyGrid.js
 * @require overrides/ext/dd/DragTracker.js
 * @require overrides/gxp/plugins/FeatureEditor.js
 * @require overrides/gxp/plugins/AddLayers.js
 * @require overrides/geoext/plugins/TreeNodeComponent.js
 * @require overrides/geoext/widgets/LayerOpacitySlider.js
 * @require overrides/gxp/plugins/LayerTree.js
 * @require overrides/gxp/plugins/WMSSource.js
 * @require overrides/gxp/widgets/WMSLayerPanel.js
 * @require overrides/gxp/plugins/WMSGetFeatureInfo.js
 * @require overrides/gxp/widgets/ScaleOverlay.js
 *
 * @require helpers.js
 * @require loadJSFile.js
 * @require searchRecordSelectHandler.js
 * @require buildWFSLayer.js
 * @require buildWestPanel.js
 * @require buildComboStore.js
 * @require buildAllFeaturesDataStore.js
 * @require addDefaultTabs.js
 * @require doClearHighlight.js
 * @require buildAccordion.js
 * @require buildTabExpand.js
 * @require buildNorthPart.js
 * @require onConfigurationLoaded.js
 * @require requestConfig.js
 */

var gtProxy,
    gtLoginEndpoint,
    gtLocalLayerSourcePrefix;
var debugMode = (/(localhost|\.dev|\.local)/i).test(window.location.hostname);

if (debugMode)
{
    gtProxy = "proxy/?url=";
    gtLoginEndpoint = "http://v3.pozi.com/geoexplorer/login/";
    gtLocalLayerSourcePrefix = "http://v3.pozi.com";
}
else
{
    gtProxy = "/geoexplorer/proxy/?url=";
    gtLoginEndpoint = "/geoexplorer/login";
    gtLocalLayerSourcePrefix = "";
}

var app;
var gComboDataArray = [],
    gfromWFSFlag = { value: undefined },
    gCombostore,
    gCurrentExpandedTabIdx = [],
    gLoggedRole = { current: "NONE" },
    eastPanel,
    westPanel,
    northPart,
    gLayoutsArr,
    gLoggedUsername,
    gLoggedPassword;
var vector_layer = new OpenLayers.Layer.Vector("WKT", {
        displayInLayerSwitcher: false
    });
var wkt_format = new OpenLayers.Format.WKT();
var gtLayerLabel = { value: undefined };

Ext.onReady(function() {
    requestConfig({
        onLoad: function(clientConfig, propertyDataInit) {
            JSONconf = clientConfig; // This is still necessary because JSONconf is used as a global in some gxp overrides.
            onConfigurationLoaded(clientConfig, propertyDataInit);
        }
    })
});

