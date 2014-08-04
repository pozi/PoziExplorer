// Vector layer used to highlight elements from nearby tabs
var vector_layer = new OpenLayers.Layer.Vector("WKT", { displayInLayerSwitcher: false });

// Parameter is the id for the feature clicked
var showGarbageLayer = function(a){
	// Checking if the test layer is visible (ticked on)
	var testLayer = app.mapPanel.layers.queryBy(function(x){
		return x.get("title") === "Garbage Collection";
	});

	// Setting the visibility to true if it wasn't already
	if (testLayer.items.length)
	{
		if (!(testLayer.items[0].data.layer.getVisibility()))
		{
			testLayer.items[0].data.layer.setVisibility(true);
		}
	}
}

// No passed parameter
var hideGarbageLayer = function(){
	// Removing the selected feature
	vector_layer.removeAllFeatures();

	// Masking the test layer
	var testLayer = app.mapPanel.layers.queryBy(function(x){
		return x.get("title") === "Garbage Collection";
	});

	// Setting the visibility to true if it wasn't already
	if (testLayer.items.length)
	{
		if (testLayer.items[0].data.layer.getVisibility())
		{
			testLayer.items[0].data.layer.setVisibility(false);
		}
	}
}
