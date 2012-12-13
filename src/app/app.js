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
 * @require overrides/gxp/plugins/Styler.js
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
 * @require buildTabCollapse.js
 * @require buildNorthPart.js
 * @require buildEastPanel.js
 * @require buildPortalItems.js
 * @require loadTabConfig.js
 * @require buildApp.js
 * @require buildFeaturesAddedHandler.js
 * @require addOpacitySlider.js
 * @require initAuthorization.js
 * @require onConfigurationLoaded.js
 * @require requestConfig.js
 */

var app;
var gCombostore; // store powering northPart dropdown
var gComboDataArray = { value: [] }; // maybe don't need this if we have the gCombostore (?)
var eastPanel;
var westPanel;
var northPart;
var gLayoutsArr; // for each layer (e.g. property address), lists additional tabs
var gCurrentExpandedTabIdx = []; // index of currently opened tab, per layer (feature type)
var gfromWFSFlag = { value: undefined }; // tracks whether combostore was populated via seach selection or direct click on map
                                         // (true = WFS = search selection, false = get feature info which is text not XML or JSON)
var gCurrentLoggedRole = { value: "NONE" }; // 'NONE', 'ROLE_ADMINISTRATOR' - role that user is currently logged in as
var gtyp = { value: undefined }; // feature type (e.g Address)
var glab = { value: undefined }; // feature label (e.g. 12 Acorn Lane Packenham 3810)
var gtLayerLabel = { value: undefined };

Ext.onReady(function() {
    requestConfig({
        onLoad: function(clientConfig, propertyDataInit) {
            JSONconf = clientConfig; // This is still necessary because JSONconf is used as a global in some gxp overrides.
            onConfigurationLoaded(clientConfig, propertyDataInit);
        }
    })
});

