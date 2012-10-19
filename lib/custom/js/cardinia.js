// Parameter is the id for the feature clicked
var f1 = function(a){
	///alert("Displaying test tab for feature: "+a);
	
	// Checking if the test layer is visible (ticked on)
	var testLayer = app.mapPanel.layers.queryBy(function(x){
                //return x.get("queryable");
		//return x.get("queryable") && x.get("layer").visibility && (x.get("group") != "background") 
		return x.get("title") === "Schools";
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
var f3 = function(){
	// Removing the selected feature
	vector_layer.removeAllFeatures();

	// Masking the test layer
	var testLayer = app.mapPanel.layers.queryBy(function(x){
                //return x.get("queryable");
		//return x.get("queryable") && x.get("layer").visibility && (x.get("group") != "background") 
		return x.get("title") === "Schools";
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

// Parameter is the subtab being activated
var f2 = function(b){
	///alert("Displaying subtab: "+b.title+" with geometry "+b.the_geom);

	// Highlighting the object from the tab currently selected with a custom style
	var styles = new OpenLayers.StyleMap({
		"default": {
			graphicName: "square",
			pointRadius: 20,
			strokeColor: "#FA58AC",
			strokeWidth: 5,
			fillColor: "",
			fillOpacity: 0
		}
	});

	// Clearing previous feature
	vector_layer.removeAllFeatures();
	vector_layer.styleMap = styles;	
	
	// Reading new one, and adding it
	var feature = wkt_format.read(b.the_geom);
	vector_layer.addFeatures([feature]);
	// Refreshing the view
	app.mapPanel.map.addLayer(vector_layer);	
	
	// Zooming in/out so that the view contains both the original property and the highlighted feature
	var b1 = feature.geometry.getBounds();
	var bd = glayerLocSel.getDataExtent();
	bd.extend(b1);	

	// Providing a buffer around the bounds that contains both the features
	var h_buff = bd.getSize().h/8;
	var w_buff = bd.getSize().w/8;
	bd.bottom = bd.bottom - h_buff;
	bd.top = bd.top + h_buff;
	bd.left = bd.left - w_buff;
	bd.right = bd.right + w_buff;

	var z = app.mapPanel.map.getZoomForExtent(bd);
	
	app.mapPanel.map.panTo(new OpenLayers.LonLat((bd.left+bd.right)/2,(bd.top+bd.bottom)/2));
	if (z < app.mapPanel.map.getZoom())
	{
		setTimeout(function(){app.mapPanel.map.zoomTo(z);},1000);
	}
}