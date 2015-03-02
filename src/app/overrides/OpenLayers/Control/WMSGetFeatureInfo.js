/**
 * Method: buildWMSOptions
 * Build an object with the relevant WMS options for the GetFeatureInfo request
 *
 * Parameters:
 * url - {String} The url to be used for sending the request
 * layers - {Array(<OpenLayers.Layer.WMS)} An array of layers
 * clickPosition - {<OpenLayers.Pixel>} The position on the map where the mouse
 *     event occurred.
 * format - {String} The format from the corresponding GetMap request
 */
OpenLayers.Control.WMSGetFeatureInfo.prototype.buildWMSOptions = function(url, layers, clickPosition, format) {
    var layerNames = [], styleNames = [];
    for (var i = 0, len = layers.length; i < len; i++) {
        if (layers[i].params.LAYERS != null) {
            layerNames = layerNames.concat(layers[i].params.LAYERS);
            styleNames = styleNames.concat(this.getStyleNames(layers[i]));
        }
    }
    var firstLayer = layers[0];
    // use the firstLayer's projection if it matches the map projection -
    // this assumes that all layers will be available in this projection
    var projection = this.map.getProjection();
    var layerProj = firstLayer.projection;
    if (layerProj && layerProj.equals(this.map.getProjectionObject())) {
        projection = layerProj.getCode();
    }
    var params = OpenLayers.Util.extend({
        service: "WMS",
        version: firstLayer.params.VERSION,
        request: "GetFeatureInfo",
        exceptions: firstLayer.params.EXCEPTIONS,
        bbox: this.map.getExtent().toBBOX(null,
            firstLayer.reverseAxisOrder()),
        feature_count: this.maxFeatures,
        height: this.map.getSize().h,
        width: this.map.getSize().w,
        format: format,
        // Adding support for CQL_FILTER
        cql_filter: firstLayer.params.CQL_FILTER,
        info_format: firstLayer.params.INFO_FORMAT || this.infoFormat
    }, (parseFloat(firstLayer.params.VERSION) >= 1.3) ?
        {
            crs: projection,
            i: parseInt(clickPosition.x),
            j: parseInt(clickPosition.y)
        } :
        {
            srs: projection,
            x: parseInt(clickPosition.x),
            y: parseInt(clickPosition.y)
        }
    );
    if (layerNames.length != 0) {
        params = OpenLayers.Util.extend({
            layers: layerNames,
            query_layers: layerNames,
            styles: styleNames
        }, params);
    }
    OpenLayers.Util.applyDefaults(params, this.vendorParams);
    return {
        url: url,
        params: OpenLayers.Util.upperCaseObject(params),
        callback: function(request) {
            this.handleResponse(clickPosition, request, url);
        },
        scope: this
    };
};

/**
* Method: triggerGetFeatureInfo
* Trigger the getfeatureinfo event when all is done
*
* Parameters:
* request - {XMLHttpRequest} The request object
* xy - {<OpenLayers.Pixel>} The position on the map where the
* mouse event occurred.
* features - {Array(<OpenLayers.Feature.Vector>)} or
* {Array({Object}) when output is "object". The object has a url and a
* features property which contains an array of features.
*/
OpenLayers.Control.WMSGetFeatureInfo.prototype.triggerGetFeatureInfo = function(request, xy, features) {
    this.events.triggerEvent("getfeatureinfo", {
        text: request.responseText,
        features: features,
        request: request,
        xy: xy
    });
    // Reset the cursor (only if this.map is defined)
    if (this.map)
    {
        OpenLayers.Element.removeClass(this.map.viewPortDiv, "olCursorWait");
    }
};
