 /** private: method[checkIfStyleable]
* :arg layerRec: ``GeoExt.data.LayerRecord``
* :arg describeRec: ``Ext.data.Record`` Record from a
* `GeoExt.data.DescribeLayerStore``.
*
* Given a layer record and the corresponding describe layer record,
* determine if the target layer can be styled. If so, enable the launch
* action.
*/
// Reasons for override:
// - managing URL arrays

gxp.plugins.Styler.prototype.checkIfStyleable = function(layerRec, describeRec) {
	if (describeRec) {
		var owsTypes = ["WFS"];
		if (this.rasterStyling === true) {
			owsTypes.push("WCS");
		}
	}
	if (describeRec ? owsTypes.indexOf(describeRec.get("owsType")) !== -1 : !this.requireDescribeLayer) {
		var editableStyles = false;
		var source = this.target.layerSources[layerRec.get("source")];
		var url;
		// TODO: revisit this
		var restUrl = layerRec.get("restUrl");
		if (restUrl) {
			url = restUrl + "/styles";
		} else {
			url = source.url.split("?").shift().replace(/\/(wms|ows)\/?$/, "/rest/styles");
		}
		if (this.sameOriginStyling) {
			// this could be made more robust
			// for now, only style for sources with relative url
			editableStyles = url.charAt(0) === "/";
			// and assume that local sources are GeoServer instances with
			// styling capabilities
			if (this.target.authenticate && editableStyles) {
				// we'll do on-demand authentication when the button is
				// pressed.
				this.launchAction.enable();
				return;
			}
		} else {
			editableStyles = true;
		}
		if (editableStyles) {
			if (this.target.isAuthorized()) {
				// check if service is available
				this.enableActionIfAvailable(url);
			}
		}
	}
};