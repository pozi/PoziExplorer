// Vector layer used to highlight elements from nearby tabs
var vector_layer = new OpenLayers.Layer.Vector("WKT", { displayInLayerSwitcher: false });

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

var careFacilities1 = function(a){
	///alert("Displaying test tab for feature: "+a);
	
	// Checking if the test layer is visible (ticked on)
	var testLayer = app.mapPanel.layers.queryBy(function(x){
                //return x.get("queryable");
		//return x.get("queryable") && x.get("layer").visibility && (x.get("group") != "background") 
		return x.get("title") === "Care Facilities";
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

var secondarySchools1 = function(a){
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

var ewasteCenters1 = function(a){
	///alert("Displaying test tab for feature: "+a);

	// Checking if the test layer is visible (ticked on)
	var testLayer = app.mapPanel.layers.queryBy(function(x){
                //return x.get("queryable");
		//return x.get("queryable") && x.get("layer").visibility && (x.get("group") != "background") 
		return x.get("title") === "eWaste Drop Off Points";
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

var careFacilities2 = function(){
	// Removing the selected feature
	vector_layer.removeAllFeatures();

	// Masking the test layer
	var testLayer = app.mapPanel.layers.queryBy(function(x){
                //return x.get("queryable");
		//return x.get("queryable") && x.get("layer").visibility && (x.get("group") != "background") 
		return x.get("title") === "Care Facilities";
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

var secondarySchools2 = function(){
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

var ewasteCenters2 = function(){
	// Removing the selected feature
	vector_layer.removeAllFeatures();

	// Masking the test layer
	var testLayer = app.mapPanel.layers.queryBy(function(x){
                //return x.get("queryable");
		//return x.get("queryable") && x.get("layer").visibility && (x.get("group") != "background") 
		return x.get("title") === "eWaste Drop Off Points";
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
			strokeWidth: 10,
			strokeOpacity: 0.5,
			fillColor: "",
			fillOpacity: 0
		}
	});

	// Clearing previous feature
	vector_layer.removeAllFeatures();
	vector_layer.styleMap = styles;	
	
	// Reading new one, and adding it
	var feature = new OpenLayers.Format.WKT().read(b.the_geom);
	vector_layer.addFeatures([feature]);
	// Refreshing the view
	app.mapPanel.map.addLayer(vector_layer);	

	var p4326 = new OpenLayers.Projection("EPSG:4326");
	var p900913 = new OpenLayers.Projection("EPSG:900913");

	// In a projected reference system, getCentroid calculation can get lost with too many decimals
	// Reference: http://lists.osgeo.org/pipermail/openlayers-users/2011-June/021210.html
	// So we remove all the decimals from the geometry
	var from_geom = new OpenLayers.Format.WKT().read(
	    new OpenLayers.Format.WKT().write(
	        app.getSelectionLayer().features[0]
	    ).replace(/\.[0-9]*/g,"")
	);

	var fromlatlon = from_geom.geometry.getCentroid().transform(p900913,p4326);
	var tolatlon = feature.geometry.getCentroid().transform(p900913,p4326);
	
	// Sending an AJAX request to the MapQuest API to obtain the route
	var myRouteStore = new Ext.data.JsonStore({
		autoLoad: true,
		root: 'route',
		baseParams:{
			from:fromlatlon.y+','+fromlatlon.x,
			to:tolatlon.y+','+tolatlon.x,
			shapeFormat:'raw',
			generalize:0,
			key:decodeURIComponent("Fmjtd%7Cluuanuuyll%2C7s%3Do5-96bx9r")
		},
		proxy : new Ext.data.ScriptTagProxy({
			url: 'http://www.mapquestapi.com/directions/v1/route'
		}),
		fields: [
			{name: "statuscode"  , mapping:"info.statuscode"}
		],
		listeners:{
			load:function(e){
				//alert("Loaded");
				var json = e.reader.jsonData;
				if (json.info.statuscode !== 0)
				{
					// No routing can be displayed
					if (typeof console != "undefined") {
						console.warn("Routing directions could not be obtained (status code = "+json.info.statuscode+")");
					}
				}
				else
				{
					// Build a feature out of coordinates
					var points = new Array();
					// The object below exists because the API callback status code is 0
					var jsonPtsArr = json.route.shape.shapePoints;
					
					for(k=0;k<jsonPtsArr.length;k=k+2){
						points.push((new OpenLayers.Geometry.Point(jsonPtsArr[k+1], jsonPtsArr[k])).transform(p4326,p900913));
					};
					var line = new OpenLayers.Geometry.LineString(points);
					var line_feature = new OpenLayers.Feature.Vector();
					line_feature.geometry = line;
					
					// Add the feature to the vector layer
					vector_layer.addFeatures([line_feature]);
					
					// Possibly refresh the layer?
					vector_layer.redraw();
				}
			}
		}
	});
	
	// Zooming in/out so that the view contains both the original property and the highlighted feature
	var b1 = feature.geometry.getBounds();
	var bd = app.getSelectionLayer().getDataExtent();
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
