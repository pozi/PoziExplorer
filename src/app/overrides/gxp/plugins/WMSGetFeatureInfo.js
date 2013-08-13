// There is very little code in this that we actually use in the overridden version.
// We should probably just make a new control (based on this, but not an override
// or extension of it) and use that instead of this.
//
// Here's what the GXP version does (and what we actually want):
//  * adds a button for the inspect tool (we want always on, no UI needed)
//  * adds a OpenLayers.Control.WMSGetFeatureInfo control to each layer
//    when the layer tree changes (we want)
//  * displays the returned feature info in a popup (we want to do something else with it)

/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires plugins/Tool.js
 * @requires GeoExt/widgets/Popup.js
 * @requires OpenLayers/Control/WMSGetFeatureInfo.js
 * @requires OpenLayers/Format/WMSGetFeatureInfo.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = WMSGetFeatureInfo
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: WMSGetFeatureInfo(config)
 *
 *    This plugins provides an action which, when active, will issue a
 *    GetFeatureInfo request to the WMS of all layers on the map. The output
 *    will be displayed in a popup.
 */   
gxp.plugins.WMSGetFeatureInfo = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gxp_wmsgetfeatureinfo */
    ptype: "gxp_wmsgetfeatureinfo",
    
    /** api: config[outputTarget]
     *  ``String`` Popups created by this tool are added to the map by default.
     */
    outputTarget: "map",

    /** private: property[popupCache]
     *  ``Object``
     */
    popupCache: null,

    /** api: config[infoActionTip]
     *  ``String``
     *  Text for feature info action tooltip (i18n).
     */
    infoActionTip: "Get Feature Info",

    /** api: config[popupTitle]
     *  ``String``
     *  Title for info popup (i18n).
     */
    popupTitle: "Feature Info",
    
    /** api: config[text]
     *  ``String`` Text for the GetFeatureInfo button (i18n).
     */
    buttonText: "Identify",
    
    /** api: config[format]
     *  ``String`` Either "html" or "grid". If set to "grid", GML will be
     *  requested from the server and displayed in an Ext.PropertyGrid.
     *  Otherwise, the html output from the server will be displayed as-is.
     *  Default is "html".
     */
    format: "html",
    
    /** api: config[vendorParams]
     *  ``Object``
     *  Optional object with properties to be serialized as vendor specific
     *  parameters in the requests (e.g. {buffer: 10}).
     */
    vendorParams: {
      buffer: 15
    },
    
    /** api: config[layerParams]
     *  ``Array`` List of param names that should be taken from the layer and
     *  added to the GetFeatureInfo request (e.g. ["CQL_FILTER"]).
     */
     
    /** api: config[itemConfig]
     *  ``Object`` A configuration object overriding options for the items that
     *  get added to the popup for each server response or feature. By default,
     *  each item will be configured with the following options:
     *
     *  .. code-block:: javascript
     *
     *      xtype: "propertygrid", // only for "grid" format
     *      title: feature.fid ? feature.fid : title, // just title for "html" format
     *      source: feature.attributes, // only for "grid" format
     *      html: text, // responseText from server - only for "html" format
     */

    /** api: method[addActions]
     */
    addActions: function() {
        this.popupCache = {};
        
        var actions = gxp.plugins.WMSGetFeatureInfo.superclass.addActions.call(this, [{
            // tooltip: this.infoActionTip,
            // iconCls: "gxp-icon-getfeatureinfo",
            buttonText: this.buttonText,
            toggleGroup: this.toggleGroup,
            disabled: true, // The info button does not need to be clickable
            enableToggle: true,
            allowDepress: true,
            toggleHandler: function(button, pressed) {
                for (var i = 0, len = info.controls.length; i < len; i++){
                    if (pressed) {
                        info.controls[i].activate();
                    } else {
                        info.controls[i].deactivate();
                    }
                }
             }
        }]);
        var infoButton = this.actions[0].items[0];

        var info = {controls: []};
        var updateInfo = function() {
            var queryableLayers = this.target.mapPanel.layers.queryBy(function(x){
                return x.get("queryable") &&
                       x.get("layer").visibility &&
                       (x.get("group") != "background");
            });
            // Keeping track of the number of objects to be returned
            var layerMax = queryableLayers.length;
            // ID within the combostore must be unique, so we use a counter
            var id_ct = 0;
            // Count the number of features within a layer
            var layerCounter = 0;

            var map = this.target.mapPanel.map;
            var control;
            for (var i = 0, len = info.controls.length; i < len; i++){
                control = info.controls[i];
                control.deactivate();  // TODO: remove when http://trac.openlayers.org/ticket/2130 is closed
                control.destroy();
            }

            info.controls = [];
            queryableLayers.each(function(x){
                var layer = x.getLayer();
                var vendorParams = Ext.apply({}, this.vendorParams), param;
                if (this.layerParams) {
                    for (var i=this.layerParams.length-1; i>=0; --i) {
                        param = this.layerParams[i].toUpperCase();
                        vendorParams[param] = layer.params[param];
                    }
                }
                var infoFormat = x.get("infoFormat");
                if (infoFormat === undefined) {
                    // TODO: check if chosen format exists in infoFormats array
                    // TODO: this will not work for WMS 1.3 (text/xml instead for GML)
                    infoFormat = "text/html";
                }
                var control = new OpenLayers.Control.WMSGetFeatureInfo(Ext.applyIf({
                    url: (typeof layer.url == "object" ? layer.url[0] : layer.url), // Managing array of URLs
                    queryVisible: true,
                    radius: 64, // this might be trying to do what 'buffer' does above
                    layers: [layer],
                    infoFormat: infoFormat,
                    vendorParams: vendorParams,
                    eventListeners: {
                        getfeatureinfo: function(evt) {

                            var distanceOfWKTFromClick = function(wkt) {
                                var WGS84 = "EPSG:4326";
                                var clickLonLat = map.getLonLatFromPixel(evt.xy);
                                var clickGeom = new OpenLayers.Geometry.Point(clickLonLat.lon, clickLonLat.lat);
                                var wktGeom = OpenLayers.Geometry.fromWKT(wkt).transform(WGS84, map.projection);
                                return wktGeom.atPoint(clickLonLat) ? 0.0 : wktGeom.distanceTo(clickGeom);
                            };
                        
                            layerCounter = layerCounter + 1;
                            var idx = 0;
                            // Index contains the position of the layer within the tree layer
                            for (var i = 0; i < app.mapPanel.layers.data.items.length; i++) {
                                if (app.mapPanel.layers.data.items[i] === x) { idx = i; break; }
                            }

                            // Attempting to decode the string as JSON
                            var featureContent;
                            try {
                                var wkt = new OpenLayers.Format.WKT();
                                var geojson = new OpenLayers.Format.GeoJSON();

                                // Interpreting the return as a GeoJSON - if this fails, the catch will interpret it as text/html
                                var features_geojson = geojson.read(evt.text);

                                // Building an array of features returned
                                featureContent = Array(features_geojson.length);

                                // For each feature returned, we extract properties and geometry (in WKT)
                                for (var j = 0; j < features_geojson.length; j++) {
                                    featureContent[j] = {};
                                    featureContent[j].row = {};
                                    featureContent[j].row = features_geojson[j].data;
                                    featureContent[j].row["the_geom"] = wkt.write(features_geojson[j]);
                                }

                            } catch(e) {
                                // If it was not JSON, it is HTML surrounding a JSON object, that we decode
                                // TODO: this section is bound to disappear as we want to use application/json as infoFormat everywhere
                                var match = evt.text.match(/<body[^>]*>([\s\S]*)<\/body>/);
                                if (match && !match[1].match(/^\s*$/)) {
                                    featureContent = Ext.util.JSON.decode(match[1].replace('\\\'', '\'')).rows;
                                }
                            }

                            Ext.each(featureContent, function(featureContentItem) {
                                // We hydrate an object that powers the datastore for the right panel combo
                                var row_array;
                                // All the attributes are contained in a serialised JSON object
                                var cont = featureContentItem.row;

                                // Id - need to be distinct for all objects in the drop down: if several layers activated, must be different across all layers
                                id_ct++;
                                // Type - from the layer name in the layer selector
                                var typ = x.data.title;
                                // Attempt to format it nicely (removing the parenthesis content)
                                var simpleTitle = x.data.title.match(/(.*) ?\(.*\)/);
                                if (simpleTitle) {
                                    typ = helpers.trim(simpleTitle[1]);
                                }

                                // Layer name (without namespace), to enable additional accordion panels
                                var lay = x.data.layer.params.LAYERS.split(":")[1];
                                // Catering for layer groups (they don't have a workspace name as a prefix)
                                if (!lay)
                                {
                                    lay = x.data.layer.params.LAYERS;
                                }

                                // Label
                                var lab = '';
                                var fti_arr = JSONconf.layerPresentation[lay];
                                // We select the right attribute as the label
                                if (fti_arr) {
                                    // If the layer presentation is configured, we select the first configured field value
                                    lab = cont[fti_arr[0].attr_name];
                                } else {
                                    for (l in cont) {
                                        // If not, we select the first field that comes along (provided it's not a geometry and it's value is non null)
                                        if (l != "the_geom" && l != "SHAPE" && l != "projection") {
                                            var lab = cont[l];
                                            if (lab) { break; }
                                        }
                                    }
                                }
                                // If too long for the drop down, we truncate the string to the space remaining after "<LAYER NAME>:"
                                var num_char_in_drop_down = 38;
                                if (lab.length > num_char_in_drop_down - typ.length) {
                                    lab = lab.substring(0, num_char_in_drop_down - typ.length - 2) + "..";
                                }

                                // Building a row and pushing it to an array
                                row_array = new Array(id_ct, typ, cont, idx, lab, lay);

                                gComboDataArray.value.push(row_array);

                            });

                            // Only to be executed when all queriable layers have been traversed (depends number of layers actually ticked in the layer tree)
                            if (layerCounter == layerMax) {
                                // Remove any previous results, but without performing the collapse functions on subtabs
                                // This allows to keep layers that were switched on
                                app.clearHighlight();

                                if (gComboDataArray.value.length) {
                                    var cb = Ext.getCmp('gtInfoCombobox');
                                    if (cb.disabled) { cb.enable(); }
                                    gComboDataArray.value.sort(function(a, b) {
                                        var layerComparison = b[3] - a[3];
                                        var distanceComparison = distanceOfWKTFromClick(a[2]["the_geom"]) - distanceOfWKTFromClick(b[2]["the_geom"]);
                                        return layerComparison !== 0 ? layerComparison : distanceComparison;
                                    });
                                    app.getSelectionLayer().extraVars.WFS = false;
                                    gCombostore.loadData(gComboDataArray.value);

                                    // Features found during the getFeatureInfo: showing the tab
                                    if (! (JSONconf.hideSelectedFeaturePanel)) {
                                        northPart.setHeight(60);
                                        Ext.getCmp('gtInfoCombobox').setVisible(true);
                                        // Collapsing the drop-down
                                        Ext.getCmp('gtInfoCombobox').collapse();
                                    }
                                    eastPanel.expand();
                                }

                                gComboDataArray.value = [];
                                layerCounter = 0;
                            }

                        },
                        scope: this
                    }
                }, this.controlOptions));
                map.addControl(control);
                info.controls.push(control);
                control.activate(); // Always activate info control
            }, this);

        };
        
        this.target.mapPanel.layers.on("update", updateInfo, this);
        this.target.mapPanel.layers.on("add", updateInfo, this);
        this.target.mapPanel.layers.on("remove", updateInfo, this);
        
        return actions;
    }
    
});

Ext.preg(gxp.plugins.WMSGetFeatureInfo.prototype.ptype, gxp.plugins.WMSGetFeatureInfo);
