/** private: method[addLayers]
 *  :arg records: ``Array`` the layer records to add
 *  :arg source: :class:`gxp.plugins.LayerSource` The source to add from
 *  :arg isUpload: ``Boolean`` Do the layers to add come from an upload?
 */
// Reasons for override:
// - do not zoom to layer extent when it's added
// - more precise control of the group a layer is being added to

gxp.plugins.AddLayers.prototype.addLayers = function(records, source, isUpload) {
    source = source || this.selectedSource;
    var layerStore = this.target.mapPanel.layers,
        extent, record, layer;
    for (var i=0, ii=records.length; i<ii; ++i) {
        record = source.createLayerRecord({
            name: records[i].get("name"),
            source: source.id
        });
        if (record) {
            layer = record.getLayer();
            if (layer.maxExtent) {
                if (!extent) {
                    extent = record.getLayer().maxExtent.clone();
                } else {
                    extent.extend(record.getLayer().maxExtent);
                }
            }
if (record.get("group") === "background") {

                layerStore.insert(0, [record]);
            } else {
    // TODO: Try triggering the layer/map refresh that happens when drag/dropping a layer
                layerStore.add([record]);
            }
        }
    }
    if (extent) {
      // TODO: we could trigger the zoomToExtent but only if we are outside the extent
        //this.target.mapPanel.map.zoomToExtent(extent);
    }
    if (records.length === 1 && record) {	
        // select the added layer
        this.target.selectLayer(record);
        if (isUpload && this.postUploadAction) {
            // show LayerProperties dialog if just one layer was uploaded
            var outputConfig,
                actionPlugin = this.postUploadAction;
            if (!Ext.isString(actionPlugin)) {
                outputConfig = actionPlugin.outputConfig;
                actionPlugin = actionPlugin.plugin;
            }
            this.target.tools[actionPlugin].addOutput(outputConfig);
        }
    }
};
