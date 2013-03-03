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
