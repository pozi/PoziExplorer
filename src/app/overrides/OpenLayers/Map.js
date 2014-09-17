/**
* Method: setLayerZIndex
* 
* Parameters:
* layer - {<OpenLayers.Layer>} 
* zIdx - {int} 
*/

// Reason for override: better management of z-index

OpenLayers.Map.prototype.setLayerZIndex = function (layer, zIdx) {
    var offset = this.Z_INDEX_BASE[layer.isBaseLayer ? 'BaseLayer' : 'Overlay'];
    var multiplier = 3;

    // Modification if vector or GeoRSS layer, so that they appear on top
    if (layer.CLASS_NAME == "OpenLayers.Layer.GeoRSS" || layer.CLASS_NAME == "OpenLayers.Layer.Vector")
    {
        offset = this.Z_INDEX_BASE["Feature"];
        multiplier = 2;
    }

    // Modification for root containers - they need to be on top of the feature layers
    if (layer.CLASS_NAME == "OpenLayers.Layer.Vector.RootContainer")
    {
    	offset = this.Z_INDEX_BASE["Feature"] + 100;
    }

    layer.setZIndex( offset + zIdx * multiplier );
};