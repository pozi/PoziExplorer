/**
 * Add all your dependencies here.
 *
 * @require widgets/Viewer.js
 * @require plugins/LayerManager.js
 * @require plugins/OLSource.js
 * @require plugins/OSMSource.js
 * @require plugins/WMSCSource.js
 * @require plugins/Zoom.js
 * @require plugins/ZoomToLayerExtent.js
 * @require plugins/AddLayers.js
 * @require plugins/RemoveLayer.js
 * @require plugins/WMSGetFeatureInfo.js
 * @require plugins/Print.js
 * @require plugins/LayerProperties.js
 * @require widgets/WMSLayerPanel.js
 * @require RowExpander.js
 * @require GeoExt/widgets/PrintMapPanel.js
 * @require GeoExt/plugins/PrintProviderField.js
 * @require GeoExt/plugins/PrintPageField.js
 * @require GeoExt/plugins/PrintExtent.js
 * @require OpenLayers/Layer.js
 * @require OpenLayers/Renderer.js
 * @require OpenLayers/Renderer/SVG.js 
 * @require OpenLayers/Renderer/VML.js 
 * @require OpenLayers/Renderer/Canvas.js 
 * @require OpenLayers/StyleMap.js
 * @require OpenLayers/Feature/Vector.js
 * @require OpenLayers/Console.js
 * @require OpenLayers/Lang.js 
 * @require OpenLayers/Layer/Vector.js
 * @require OpenLayers/Control/ScaleLine.js
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
 */

var app;
var glayerLocSel;
var poziLinkClickHandler;

Ext.onReady(function() {

	// Overrides still needed after moving to GXP on 2.5

    /** api: method[createStore]
     *
     *  Creates a store of layer records.  Fires "ready" when store is loaded.
     */

 	// Reasons for override:
	// - managing URL parameters that are arrays

    gxp.plugins.WMSSource.prototype.createStore = function() {
        var baseParams = this.baseParams || {
            SERVICE: "WMS",
            REQUEST: "GetCapabilities"
        };
        if (this.version) {
            baseParams.VERSION = this.version;
        }

        var lazy = this.isLazy();
        
        this.store = new GeoExt.data.WMSCapabilitiesStore({
            // Since we want our parameters (e.g. VERSION) to override any in the 
            // given URL, we need to remove corresponding paramters from the 
            // provided URL.  Simply setting baseParams on the store is also not
            // enough because Ext just tacks these parameters on to the URL - so
            // we get requests like ?Request=GetCapabilities&REQUEST=GetCapabilities
            // (assuming the user provides a URL with a Request parameter in it).

	    // Override consists of using the first URL of the array if there are several
            //url: this.trimUrl(this.url, baseParams),
            url: this.trimUrl((typeof this.url=="object"?this.url[0]:this.url), baseParams),
            
            baseParams: baseParams,
            format: this.format,
            autoLoad: !lazy,
            layerParams: {exceptions: null},
            listeners: {
                load: function() {
                    // The load event is fired even if a bogus capabilities doc 
                    // is read (http://trac.geoext.org/ticket/295).
                    // Until this changes, we duck type a bad capabilities 
                    // object and fire failure if found.
                    if (!this.store.reader.raw || !this.store.reader.raw.service) {
                        this.fireEvent("failure", this, "Invalid capabilities document.");
                    } else {
                        if (!this.title) {
                            this.title = this.store.reader.raw.service.title;                        
                        }
                        if (!this.ready) {
                            this.ready = true;
                            this.fireEvent("ready", this);
                        } else {
                            this.lazy = false;
                            //TODO Here we could update all records from this
                            // source on the map that were added when the
                            // source was lazy.
                        }
                    }
                    // clean up data stored on format after parsing is complete
                    delete this.format.data;
                },
                exception: function(proxy, type, action, options, response, error) {
                    delete this.store;
                    var msg, details = "";
                    if (type === "response") {
                        if (typeof error == "string") {
                            msg = error;
                        } else {
                            msg = "Invalid response from server.";
                            // special error handling in IE
                            var data = this.format && this.format.data;
                            if (data && data.parseError) {
                                msg += "  " + data.parseError.reason + " - line: " + data.parseError.line;
                            }
                            var status = response.status;
                            if (status >= 200 && status < 300) {
                                // TODO: consider pushing this into GeoExt
                                var report = error && error.arg && error.arg.exceptionReport;
                                details = gxp.util.getOGCExceptionText(report);
                            } else {
                                details = "Status: " + status;
                            }
                        }
                    } else {
                        msg = "Trouble creating layer store from response.";
                        details = "Unable to handle response.";
                    }
                    // TODO: decide on signature for failure listeners
                    this.fireEvent("failure", this, msg, details);
                    // clean up data stored on format after parsing is complete
                    delete this.format.data;
                },
                scope: this
            }
        });
        if (lazy) {
            this.lazy = true;
            // ping server of lazy source with an incomplete request, to see if it is available
            
            Ext.Ajax.request({
                method: "GET",
                url: this.url,
                params: {SERVICE: "WMS"},
                callback: function(options, success, response) {
                    var status = response.status;
                    // responseText should not be empty (OGCException)
                    if (status >= 200 && status < 403 && response.responseText) {
                        this.ready = true;
                        this.fireEvent("ready", this);
                    } else {
                        this.fireEvent("failure", this,
                            "Layer source not available.",
                            "Unable to contact WMS service."
                        );
                    }
                },
                scope: this
            });
        }
    };

    /** api: method[createLayerRecord]
     *  :arg config:  ``Object``  The application config for this layer.
     *  :returns: ``GeoExt.data.LayerRecord`` or null when the source is lazy.
     *
     *  Create a layer record given the config. Applications should check that
     *  the source is not :obj:`lazy`` or that the ``config`` is complete (i.e.
     *  configured with all fields listed in :obj:`requiredProperties` before
     *  using this method. Otherwise, it is recommended to use the asynchronous
     *  :meth:`gxp.Viewer.createLayerRecord` method on the target viewer
     *  instead, which will load the source's store to complete the
     *  configuration if necessary.
     */
     
 	// Reasons for override:
	// - transition effect on single tiled layer should be null  
	// - URL of a layer should be an array, not the first one created via the layer store

	    gxp.plugins.WMSSource.prototype.createLayerRecord = function(config) {
		var record, original;
		var index = this.store.findExact("name", config.name);
		if (index > -1) {
		    original = this.store.getAt(index);
		} else if (Ext.isObject(config.capability)) {
		    original = this.store.reader.readRecords({capability: {
			request: {getmap: {href: this.url}},
			layers: [config.capability]}
		    }).records[0];
		} else if (this.layerConfigComplete(config)) {
		    original = this.createLazyLayerRecord(config);
		}
		if (original) {

		    var layer = original.getLayer().clone();

		    // Overriding the URL parameter of the GetMap to the one from the source
		    layer.url = this.url;

		    /**
		     * TODO: The WMSCapabilitiesReader should allow for creation
		     * of layers in different SRS.
		     */
		    var projection = this.getMapProjection();

		    // If the layer is not available in the map projection, find a
		    // compatible projection that equals the map projection. This helps
		    // us in dealing with the different EPSG codes for web mercator.
		    var layerProjection = this.getProjection(original);

		    var projCode = (layerProjection || projection).getCode(),
			bbox = original.get("bbox"), maxExtent;
		    if (bbox && bbox[projCode]){
			layer.addOptions({projection: layerProjection});
			maxExtent = OpenLayers.Bounds.fromArray(bbox[projCode].bbox, layer.reverseAxisOrder());
		    } else {
			var llbbox = original.get("llbbox");
			if (llbbox) {
			    var extent = OpenLayers.Bounds.fromArray(llbbox).transform("EPSG:4326", projection);
			    // make sure maxExtent is valid (transform does not succeed for all llbbox)
			    if ((1 / extent.getHeight() > 0) && (1 / extent.getWidth() > 0)) {
				// maxExtent has infinite or non-numeric width or height
				// in this case, the map maxExtent must be specified in the config
				maxExtent = extent;
			    }
			}
		    }

		    // update params from config
		    layer.mergeNewParams({
			STYLES: config.styles,
			FORMAT: config.format,
			TRANSPARENT: config.transparent,
			CQL_FILTER: config.cql_filter
		    });

		    var singleTile = false;
		    if ("tiled" in config) {
			singleTile = !config.tiled;
		    } else {
			// for now, if layer has a time dimension, use single tile
			if (original.data.dimensions && original.data.dimensions.time) {
			    singleTile = true;
			}
		    }

		    layer.setName(config.title || layer.name);
		    layer.addOptions({
			attribution: layer.attribution,
			maxExtent: maxExtent,
			restrictedExtent: maxExtent,
			singleTile: singleTile,
			ratio: config.ratio || 1,
			visibility: ("visibility" in config) ? config.visibility : true,
			opacity: ("opacity" in config) ? config.opacity : 1,
			buffer: ("buffer" in config) ? config.buffer : 1,
			dimensions: original.data.dimensions,
			// Inverted the base logic here
			transitionEffect: singleTile ? null : 'resize',
			minScale: config.minscale,
			maxScale: config.maxscale
		    });

		    // data for the new record
		    var data = Ext.applyIf({
			title: layer.name,
			group: config.group,
			infoFormat: config.infoFormat,
			source: config.source,
			properties: "gxp_wmslayerpanel",
			fixed: config.fixed,
			selected: "selected" in config ? config.selected : false,
			restUrl: this.restUrl,
			layer: layer
		    }, original.data);

		    // add additional fields
		    var fields = [
			{name: "source", type: "string"}, 
			{name: "group", type: "string"},
			{name: "properties", type: "string"},
			{name: "fixed", type: "boolean"},
			{name: "selected", type: "boolean"},
			{name: "restUrl", type: "string"},
			{name: "infoFormat", type: "string"}
		    ];
		    original.fields.each(function(field) {
			fields.push(field);
		    });

		    var Record = GeoExt.data.LayerRecord.create(fields);
		    record = new Record(data, layer.id);
		    record.json = config;

		} else {
		    if (window.console && this.store.getCount() > 0) {
			console.warn("Could not create layer record for layer '" + config.name + "'. Check if the layer is found in the WMS GetCapabilities response.");
		    }
		}
		return record;
	    };

	/** api: constructor
	 *  .. class:: WMSLayerPanel(config)
	 *   
	 *      Create a dialog for setting WMS layer properties like title, abstract,
	 *      opacity, transparency and image format.
	 */

 	// Reasons for override:
	// - managing URL parameters that are arrays  
	// -> this entire override could be replaced by a better management of restUrl (but it could disappear in future versions, so risky)

	gxp.WMSLayerPanel.prototype.initComponent = function() {
		this.cqlFormat = new OpenLayers.Format.CQL();
		if (this.source) {
			this.source.getSchema(this.layerRecord, function(attributeStore) {
				if (attributeStore !== false) {
					var filter = this.layerRecord.getLayer().params.CQL_FILTER;
					this.filterBuilder = new gxp.FilterBuilder({
						filter: filter && this.cqlFormat.read(filter),
						allowGroups: false,
						listeners: {
							afterrender: function() {
								this.filterBuilder.cascade(function(item) {
									if (item.getXType() === "toolbar") {
										item.addText(this.cqlPrefixText);
										item.addButton({
											text: this.cqlText,
											handler: this.switchToCQL,
											scope: this
										});
									}
								}, this);
							},
							change: function(builder) {
								var filter = builder.getFilter();
								var cql = null;
								if (filter !== false) {
									cql = this.cqlFormat.write(filter);
								}
								this.layerRecord.getLayer().mergeNewParams({
									CQL_FILTER: cql
								});
							},
							scope: this
						},
						attributes: attributeStore
					});
					this.filterFieldset.add(this.filterBuilder);
					this.filterFieldset.doLayout();
				}
			}, this);
		}
		this.addEvents(
			/** api: event[change]
			*  Fires when the ``layerRecord`` is changed using this dialog.
			*/
			"change"
		);
		this.items = [
			this.createAboutPanel(),
			this.createDisplayPanel()
		];

		// only add the Styles panel if we know for sure that we have styles
		if (this.styling && gxp.WMSStylesDialog && this.layerRecord.get("styles")) {
			// TODO: revisit this
			var url = this.layerRecord.get("restUrl");
			if (!url) {
				url = (this.source || this.layerRecord.get("layer")).url;
				if (typeof url == "object")
				{
					url = url[0];
				}
				url = url.split("?").shift().replace(/\/(wms|ows)\/?$/, "/rest");
			}
			if (this.sameOriginStyling) {
				// this could be made more robust
				// for now, only style for sources with relative url
				this.editableStyles = url.charAt(0) === "/";
			} else {
				this.editableStyles = true;
			}
			this.items.push(this.createStylesPanel(url));
		}

		gxp.WMSLayerPanel.superclass.initComponent.call(this);
	};


	// Starting by loading the specific configuration for the council using an AJAX call
	// For now, this is a static JSON file, but we expect to be able to generate it from a database
	// This JSON contains information about the map configuration

	var JSONconf = {
		tools: [{
				// A layer manager displays the legend in line with the layer tree
				ptype: "gxp_layermanager",
				outputConfig: {
					id: "tree",
					border: false,
					tbar: [] // we will add buttons to "tree.bbar" later
				},
				outputTarget: "westpanel"
			}, {
				ptype: "gxp_addlayers",
				actionTarget: "tree.tbar"
			}, {
				ptype: "gxp_removelayer",
				actionTarget: "tree.contextMenu"
			}, {
				ptype: "gxp_layerproperties",
				id: "layerproperties",
				actionTarget: "tree.contextMenu"
			},{
				ptype: "gxp_zoomtolayerextent",
				actionTarget: "tree.contextMenu"
			}, {
				ptype: "gxp_wmsgetfeatureinfo", 
				format: 'grid',
				toggleGroup: "interaction",
				showButtonText: false
			}, {
//				ptype: "gxp_measure", 
//				toggleGroup: "interaction",
//				controlOptions: {immediate: true},
//				showButtonText: true,
//			}, {
				ptype: "gxp_print",
				customParams: {outputFilename: 'PoziExplorer-print'},
				printService: "/geoserver/pdf",
				showButtonText: false
			}, {
				actions: ["->"]
			}, {
				actions: ["loginbutton"]
                }],
		sources: {
//			local: {
//				url: "/geoserver/MITCHELL/ows",
//				title: "Mitchell Shire Council Layers",
//				ptype: "gxp_wmscsource"
//				//,tiled: false
//			},
			backend_cascaded: {
				url: "http://basemap.pozi.com/geoserver/DSE/ows",
				title: "DSE Vicmap Layers",
				ptype: "gxp_wmscsource"
			},
			dse_iws_cascaded: {
				url: ["http://m1.pozi.com/geoserver/MITCHELL/ows","http://m2.pozi.com/geoserver/MITCHELL/ows","http://m3.pozi.com/geoserver/MITCHELL/ows","http://m4.pozi.com/geoserver/MITCHELL/ows"],
				title: "DSE Image Web Server",
				ptype: "gxp_wmscsource"
				//,format: "image/JPEG"
				//,group: "background"
				//,transition:'resize'
			},
//			mapquest: {
//				ptype: "gxp_mapquestsource"
//			},
			osm: {
				ptype: "gxp_osmsource"
			},
			ol: {
				ptype: "gxp_olsource"
			},
			backend: {
				url: ["http://m1.pozi.com/geoserver/ows","http://m2.pozi.com/geoserver/ows","http://m3.pozi.com/geoserver/ows","http://m4.pozi.com/geoserver/ows"],
				title: "Pozi Data Server",
				ptype: "gxp_wmscsource"
				//,transition:'resize'
			}
		},
		layers: [{
				source:"backend",
				name:"VICMAP:VW_DSE_VMPLAN_ZONE",
				title:"Planning Zones (Vicmap)",
				visibility:false,
				opacity:0.5,
				format:"image/png8",
				styles:"",
				transparent:true,
				tiled: false
			},{
				source:"backend",
				name:"VICMAP:VW_DSE_VMPLAN_OVERLAY",
				title:"Planning Overlays (Vicmap)",
				visibility:false,
				opacity:0.5,
				format:"image/png8",
				styles:"",
				transparent:true,
				tiled: false
			},{
//				source:"local",
//				name:"MITCHELL:VICMAP_BUILDINGREG_BUSHFIRE_PRONE_AREA",
//				title:"Bushfire-Prone Areas (Vicmap)",
//				visibility:false,
//				opacity:0.25,
//				format:"image/png8",
//				styles:"",
//				transparent:true
//			},{
				source:"backend",
				name:"VICMAP:VICMAP_PROPERTY_ADDRESS",
				title:"Property (Vicmap)",
				visibility:true,
				opacity:0.25,
				format:"image/GIF",
				styles:"",
				transparent:true,
				tiled:false
			},{
//				source:"local",
//				name:"MITCHELL:MSC_GARBAGE_COLLECTION",
//				title:"Waste Collection",
//				visibility:false,
//				opacity:0.6,
//				format:"image/png8",
//				styles:"",
//				transparent:true
//			},{
//				source:"local",
//				name:"MITCHELL:MSC_LEISURE_CENTRE2",
//				title:"Leisure Centres",
//				visibility:false,
//				format:"image/png",
//				styles:"",
//				transparent:true,
//				tiled:false
//			},{
//				source:"local",
//				name:"MITCHELL:MSC_SPORTS_RESERVE2",
//				title:"Sports Reserves",
//				visibility:false,
//				format:"image/png",
//				styles:"",
//				transparent:true,
//				tiled:false
//			},{
//				source:"local",
//				name:"MITCHELL:MSC_CUSTOMER_SERVICE_CENTRE2",
//				title:"Customer Service Centres",
//				visibility:false,
//				format:"image/png",
//				styles:"",
//				transparent:true,
//				tiled:false
//			},{
//				source:"local",
//				name:"MITCHELL:MSC_LIBRARY2",
//				title:"Libraries",
//				visibility:false,
//				format:"image/png",
//				styles:"",
//				transparent:true,
//				tiled:false
//			},{
//				source:"local",
//				name:"MITCHELL:MSC_KINDERGARTEN2",
//				title:"Kindergartens",
//				visibility:false,
//				format:"image/png",
//				styles:"",
//				transparent:true,
//				tiled:false
//			},{
				source:"backend",
				name:"VICMAP:VW_TRANSFER_STATION",
				title:"Transfer Stations",
				visibility:false,
				opacity:0.85,
				format:"image/png8",
				styles:"",
				transparent:true,
				tiled:false
			},{
				source:"backend",
				name:"VICMAP:VW_MITCHELL_MASK",
				title:"Municipal Boundary",
				visibility:true,
				opacity:0.6,
				format:"image/png8",
				styles:"",
				transparent:true,
				tiled:false
			},{
				source:"backend",
				name:"LabelClassic",
				title:"Labels",
				visibility:true,
				opacity:1,
				selected:false,
				format:"image/png8",
				styles:"",
				transparent:true,
				tiled:false,
				transition:''
			},{
				source:"backend",
				name:"VicmapClassic",
				title:"Vicmap Classic",
				visibility:true,
				opacity:1,
				group:"background",
				selected:false,
				format:"image/png8",
				styles:"",
				transparent:true,
				cached:true
			},{
//				source:"mapquest",
//				name: "osm",
//				visibility: false,
//				group:"background"
//			},{
				source:"dse_iws_cascaded",
				name :"MITCHELL:AERIAL_MITCHELL_2007JAN26_AIR_VIS_50CM_MGA55",
				title:"Aerial Photo (CIP 2007)",
				visibility:false,
				opacity:1,
				group:"background",
				selected:false,
				format:"image/JPEG",
				transparent:true
			},{
				source: "ol",
				group: "background",
				visibility: false,
				fixed: true,
				type: "OpenLayers.Layer.OSM",
				args: [
					"Aerial Photo (Nearmap)", "https://mitchell:v55ngas6@www.nearmap.com/maps/nml=Vert&x=${x}&y=${y}&z=${z}", {numZoomLevels: 24,transitionEffect:'resize'}
				]
			},{
				source: "ol",
				group: "background",
				fixed: true,
				type: "OpenLayers.Layer",
				args: [
					"None", {visibility: false}
				]
		}],
		center: [16143500, -4461908],
		zoom: 10,
		customJS:'mitchell.js',
		workspace: "MITCHELL"
	};
	

	// Based on the previous JSON configuration, we may decide to dynamically load an additional Javascript file of interaction customisations
	
	// Function that is able to dynamically load the extra Javascript
	var loadjscssfile = function(filename, cbk){
		var fileref = document.createElement('script');
		fileref.setAttribute("type",'text/javascript');

		// The onload callback option does not work as expected in IE so we are using the following work-around
		// From: http://www.nczonline.net/blog/2009/07/28/the-best-way-to-load-external-javascript/
		if (fileref.readyState){  
			//IE
			fileref.onreadystatechange = function(){
				if (fileref.readyState == "loaded" || fileref.readyState == "complete"){
					fileref.onreadystatechange = null;
					cbk();
				}
			};
		} else {  
			//Others
			fileref.onload = function(){
				cbk();
			};
		}
		fileref.setAttribute("src", filename);
		document.getElementsByTagName('head')[0].appendChild(fileref);
	};
	
	// Encapsulating the loading of the main app in a callback  
	var extraJSScriptLoaded = function(){
		// Global variables and their possible client-specific overrides
		var gtCollapseLayerTree = false;
		if (JSONconf.collapseLayerTree) {gtCollapseLayerTree=JSONconf.collapseLayerTree;};

		var gtEmptyTextSelectFeature = "Selected features ...";
		if (JSONconf.emptyTextSelectFeature) {gtEmptyTextSelectFeature=JSONconf.emptyTextSelectFeature;};

		var gtLogoClientSrc = "http://www.pozi.com/theme/app/img/mitchell_banner.jpg";
		var gtLogoClientWidth=238;

		var gtEmptyTextSearch = 'Find properties, roads, features, etc...';
		var gtLoadingText = 'Searching...';
		var gtLoadingText = "Loading ...";
		var gtDetailsTitle = "Details";
		var gtClearButton = "Clear";
		var gtInfoTitle = "Info";

		var gtZoomMax = 18;

		// Currently expanded tab, to manage on tab expand event
		var gCurrentExpandedTabIdx = 0;

		// Layout for the extra tabs
		var gLayoutsArr = [];
		
		// Flag to track the origin of the store refresh
		var gfromWFS="N";

		poziLinkClickHandler = function () {
			var appInfo = new Ext.Panel({
				title: "GeoExplorer",
				html: "<iframe style='border: none; height: 100%; width: 100%' src='about.html' frameborder='0' border='0'><a target='_blank' href='about.html'>" + this.aboutText + "</a> </iframe>"
			});
			var poziInfo = new Ext.Panel({
				title: "Pozi Explorer",
				html: "<iframe style='border: none; height: 100%; width: 100%' src='about-pozi.html' frameborder='0' border='0'><a target='_blank' href='about-pozi.html'>" + "</a> </iframe>"
			});
			var tabs = new Ext.TabPanel({
				activeTab: 0,
				items: [
				poziInfo,appInfo]
			});
			var win = new Ext.Window({
				title: "About this map",
				modal: true,
				layout: "fit",
				width: 300,
				height: 300,
				items: [
					tabs]
				});
			win.show();
		};	

		var gtInitialDisclaimerFlag=true;
		var gtDisclaimer="disclaimer.html";
		var gtRedirectIfDeclined="http://www.mitchellshire.vic.gov.au/";
		var gtLinkToCouncilWebsite="http://www.mitchellshire.vic.gov.au/";
		var gtBannerLineColor="#DE932A";
		var gtBannerRightCornerLine1="Mitchell Shire Council";
		var gtBannerRightCornerLine2="Victoria, Australia";

		// WFS layer: style , definition , namespaces
		var gtStyleMap = new OpenLayers.StyleMap();
		var gtSymbolizer = {name:"test",strokeColor:"yellow",strokeWidth: 15, strokeOpacity:0.5,fillColor:"yellow",fillOpacity:0.2};
		var gtWFSsrsName = "EPSG:4326";
		var gtWFSgeometryName = "the_geom";

		var gtServicesHost = "http://49.156.17.41";		
		var gtWFSEndPoint = gtServicesHost + "/geoserver/wfs";
		var gtFeatureNS="http://www.pozi.com/vicmap";
		
		// Definition of the WFS layer - arbitrarily defining a WFS layer to be able to add it to the map (so that it's ready to be used when the app has loaded)
		/*
		gtLayerLocSel = new OpenLayers.Layer.Vector("Selection", {
			styleMap: gtStyleMap,
			strategies: [new OpenLayers.Strategy.BBOX({ratio:100})],
			protocol: new OpenLayers.Protocol.WFS({
				version:       "1.1.0",
				url:           gtWFSEndPoint,
				featureType:   "VMPROP_PROPERTY",
				srsName:       gtWFSsrsName,
				featureNS:     gtFeatureNS,
				geometryName:  gtWFSgeometryName,
				schema:        gtWFSEndPoint+"?service=WFS&version=1.1.0&request=DescribeFeatureType&TypeName="+"VICMAP:VMPROP_PROPERTY"
			}),
			filter: new OpenLayers.Filter.Comparison({type: OpenLayers.Filter.Comparison.EQUAL_TO,property: 'pr_propnum',value: -1}),
			projection: new OpenLayers.Projection("EPSG:4326")			
		});
		*/

		// Pushing the WFS layer in the layer store
		JSONconf.layers.push({
			source: "ol",
			visibility: true,
			type: "OpenLayers.Layer.Vector",
			args: [
				"Selection", {
					styleMap: gtStyleMap,
					strategies: [new OpenLayers.Strategy.BBOX({ratio:100})],
				        protocol: new OpenLayers.Protocol.WFS({
						version:       "1.1.0",
						url:           gtWFSEndPoint,
						featureType:   "VMPROP_PROPERTY",
						srsName:       gtWFSsrsName,
						featureNS:     gtFeatureNS,
						geometryName:  gtWFSgeometryName,
						schema:        gtWFSEndPoint+"?service=WFS&version=1.1.0&request=DescribeFeatureType&TypeName="+"VICMAP:VMPROP_PROPERTY"
					}),
					filter: new OpenLayers.Filter.Comparison({type: OpenLayers.Filter.Comparison.EQUAL_TO,property: 'pr_propnum',value: -1}),
					projection: new OpenLayers.Projection("EPSG:4326")
				}
			]
		});		

		// Store behind the info drop-down list
		var gCombostore = new Ext.data.ArrayStore({
		    //autoDestroy: true,
		    storeId: 'myStore',
		    idIndex: 0,  
		    fields: [
		       'id',
		       'type',
		       'label',
		       'content',
		       'index',
		       'projCode',
		       'layer'
		    ],
		    listeners: {
			    load: function(ds,records,o) {
				var cb = Ext.getCmp('gtInfoCombobox');
				var rec = records[0];
				if (records.length>1)
				{
					// Multiple records, color of the combo background is different
					cb.addClass("x-form-multi");
				}
				else
				{
					// Restoring the color to a normal white
					cb.removeClass("x-form-multi");
				}
				cb.setValue(rec.data.type);
				cb.fireEvent('select',cb,rec);
				},
			    scope: this
			}
		});

		

		// In a multi-council database setup, use 346
		var gtLGACode = "346";
		// Database config for the master search table
		var gtDatabaseConfig = "vicmap";
		
		var gtSearchComboEndPoint = gtServicesHost + "/ws/rest/v3/ws_all_features_by_string_and_lga.php";
		
		// Datastore definition for the web service search results 
		var ds = new Ext.data.JsonStore({
			autoLoad: false, //autoload the data
			root: 'rows',
			baseParams: { config: gtDatabaseConfig, lga:gtLGACode},
			fields: [{name: "label"	, mapping:"row.label"},
				{name: "xmini"	, mapping:"row.xmini"},
				{name: "ymini"	, mapping:"row.ymini"},
				{name: "xmaxi"	, mapping:"row.xmaxi"},
				{name: "ymaxi"	, mapping:"row.ymaxi"},
				{name: "gsns"	, mapping:"row.gsns"},
				{name: "gsln"	, mapping:"row.gsln"},
				{name: "idcol"	, mapping:"row.idcol"},
				{name: "idval"	, mapping:"row.idval"},
				{name: "ld"	, mapping:"row.ld"}
			],
			proxy: new Ext.data.ScriptTagProxy({
				url: gtSearchComboEndPoint
			})
		});

		// Remove the WFS highlight, clear and disable the select feature combo, empty the combostore and clean the details panel 
		var clear_highlight = function(){ 
			// Removing the highlight by clearing the selected features in the WFS layer
			glayerLocSel.removeAllFeatures();

			// Fix the issue where the layer's startegy layer is nulled after printing
//			if (!(glayerLocSel.strategies[0].layer)) {glayerLocSel.strategies[0].layer=glayerLocSel;}
//			if (!(glayerLocSel.strategies[0].layer.map)) 	{glayerLocSel.strategies[0].layer.map=app.mapPanel.map;}
//			if (!(glayerLocSel.protocol.format)) 		{glayerLocSel.protocol.format=gFormat;}

			glayerLocSel.redraw();
			// Clearing combo
			var cb = Ext.getCmp('gtInfoCombobox');
			cb.collapse();
			cb.clearValue();
			cb.disable();
			cb.removeClass("x-form-multi");
			// Removing all values from the combo
			gCombostore.removeAll();
			// Clearing the details from the panel
			var e1=Ext.getCmp('gtAccordion').items.items[0].body.id;
			var e2=Ext.get(e1).dom;
			e2.innerHTML="";
		};

		// Handler called when:
		// - a record is selected in the search drop down list
		// - a property number is passed in the URL and has returned a valid property record
		var search_record_select_handler = function (combo,record){
			// Zooming to the relevant area (covering the selected record)
			var bd = new OpenLayers.Bounds(record.data.xmini,record.data.ymini,record.data.xmaxi,record.data.ymaxi).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
			var z = app.mapPanel.map.getZoomForExtent(bd);

			// Fix the issue where the WFS layer's strategy's layer and its protocol's format are nulled after invoking the printing functionality
			// Symptom is this.layer is null (strategy) or this.format is null (protocol)
//			if (!(glayerLocSel.strategies[0].layer)) 	{glayerLocSel.strategies[0].layer=glayerLocSel;}
//			if (!(glayerLocSel.strategies[0].layer.map)) 	{glayerLocSel.strategies[0].layer.map=app.mapPanel.map;}
//			if (!(glayerLocSel.protocol.format)) 		{glayerLocSel.protocol.format=gFormat;}

			if (z<gtZoomMax)
			{	
				app.mapPanel.map.zoomToExtent(bd);
			}
			else
			{// If zooming too close, taking step back to level gtZoomMax , centered on the center of the bounding box for this record
				app.mapPanel.map.moveTo(new OpenLayers.LonLat((bd.left+bd.right)/2,(bd.top+bd.bottom)/2), gtZoomMax);
			}

			// Updating the WFS protocol to fetch this record
			glayerLocSel.protocol = new OpenLayers.Protocol.WFS({
				version:       "1.1.0",
				url:           gtWFSEndPoint,
				featureType:   record.data.gsln,
				srsName:       gtWFSsrsName,
				featureNS:     gtFeatureNS,
				geometryName:  gtWFSgeometryName,
				schema:        gtWFSEndPoint+"?service=WFS&version=1.1.0&request=DescribeFeatureType&TypeName="+record.data.gsns+":"+record.data.gsln
			});

			// Filtering the WFS layer on a column name and value - if the value contains a \, we escape it by doubling it
			glayerLocSel.filter = new OpenLayers.Filter.Comparison({type: OpenLayers.Filter.Comparison.EQUAL_TO,property: record.data.idcol ,value: record.data.idval.replace('\\','\\\\') });
			gfromWFS="Y";
			gtyp=record.data.ld;
			glab=record.data.label;

			glayerLocSel.events.on({
				featuresadded: function(event) {
					if (gfromWFS=="Y")
					{
						var typ=gtyp;
						var lab=glab;

						var row_array = [];
						var cont;
						gComboDataArray=[];

						for (var k=0;k<this.features.length;k++)
						{
							// We capture the attributes brought back by the WFS call
							cont=this.features[k].data;
							// Capturing the feature as well (it contains the geometry)
							cont["the_geom_WFS"]=this.features[k];										

							// Building a record and inserting it into an array											
							row_array = new Array(k,typ,lab,cont,null,null,this.features[k].layer.protocol.featureType); 
							gComboDataArray.push(row_array);
						}

						// Clearing existing value from the drop-down list
						var cb = Ext.getCmp('gtInfoCombobox');
						cb.clearValue();

						// If there is a record (and there should be at least one - by construction of the search table)
						if (gComboDataArray.length)
						{							
							if (cb.disabled) {cb.enable();}
							gCombostore.removeAll();
							gCombostore.loadData(gComboDataArray);
							gComboDataArray=[];
						}									
					}
				}
			});
			
			// Refreshing the WFS layer so that the highlight appears and triggers the featuresadded event handler above
			glayerLocSel.refresh({force:true});

		};
		
		// Panels and portals
		var westPanel = new Ext.Panel({
			id:"westpanel",
			border: false,
			layout: "anchor",
			region: "west",
			width: 250,
			split: true,
			collapsible: true,
			collapseMode: "mini",
			collapsed: gtCollapseLayerTree,
			autoScroll:true,
			header: false,
			items: [{
				region: 'center',
				tbar: [

				],
				border: false,
				id: 'tree'
//			}, {
//				region: 'south',
//				xtype: "container",
//				border: false,
//				id: 'legend'
			}]
		});

		// Defines the north part of the east panel
		var northPart = new Ext.Panel({
			region: "north",
		    	border: false,
		    	layout: 'column',
		        height: 23,
			bodyStyle: " background-color: transparent ",
			items: [
				new Ext.Panel({
					border: false,
					layout: 'fit',
					height: 22,
					columnWidth: 1,
					items: [
						new Ext.form.ComboBox({
							id: 'gtInfoCombobox',
							store: gCombostore,
							displayField:'type',
							disabled: true,
							mode: 'local',
							typeAhead: true,
							forceSelection: true,
							triggerAction: 'all',
							emptyText: gtEmptyTextSelectFeature,
							tpl: '<tpl for="."><div class="info-item" style="height: 16px;">{type}: {label}</div></tpl>',
							itemSelector: 'div.info-item',
							listeners: {'select': function (combo,record){
										var e0=Ext.getCmp('gtAccordion');

										e0.removeAll();
										// Accordion part for normal attributes
										e0.add({id:'attributeAcc',title: gtDetailsTitle,html: '<p></p>'});

										// Layout configuration the global variable array loaded at application start										
										var configArray = gLayoutsArr[record.data.layer];
										if (configArray)
										{
											e0.add(configArray);										
										}
										
										// Refreshing the DOM with the newly added parts
										e0.doLayout();										
										//e0.items.itemAt(0).expand();
										if (!(gCurrentExpandedTabIdx[record.data.layer]))
										{
											gCurrentExpandedTabIdx[record.data.layer]="0";
										}
										e0.items.itemAt(gCurrentExpandedTabIdx[record.data.layer]).expand();
	
										// Setting a reference on this part of the DOM for injection of the attributes										
										var e1=e0.items.items[0].body.id;
										var e2=Ext.get(e1).dom;
										
										// Population of the direct attributes accordion panel
										var lab;
										var val;
										var item_array=new Array();
										var has_gsv = false;
										
										for(var k in record.data.content)
										{
											if (k=="the_geom")
											{
												lab="spatial type";
												var featureToRead = record.data.content[k];
												val=featureToRead.replace(/\(.*\)\s*/,"");
												
												// record.data.projCode contains the projection system of the highlighing geometry
												// Unfortunately, it seems that the OpenLayers transform only caters for 4326
												// Other attempts to transform from 4283 (for instance) have resulted in the data not being projected to Google's SRS
												// Attempts to invoke Proj4js library have rendered the zoom to tool ineffective (the bounding box data would not be transformed anymore)
												var wktObj = new OpenLayers.Format.WKT({
													externalProjection: new OpenLayers.Projection("EPSG:4326"), //projection your data is in
													internalProjection: new OpenLayers.Projection("EPSG:900913") //projection you map uses to display stuff
												});
												var wktfeatures = wktObj.read(featureToRead);
												
												// Should be able to select several if the control key is pressed
												glayerLocSel.removeAllFeatures();
												glayerLocSel.addFeatures(wktfeatures);
											
											}
											else if (k=="the_geom_WFS")
											{
												var wktfeatures=record.data.content[k];
												gfromWFS="N";
												lab="spatial type";
												val=wktfeatures.geometry.CLASS_NAME.replace(/OpenLayers\.Geometry\./,"").toUpperCase();
												glayerLocSel.removeAllFeatures();
												glayerLocSel.addFeatures(wktfeatures);
											}
											else
											{
												lab=k;
												val=record.data.content[k];
												if (val.search(/^http/)>-1)
												{
													if (val.search(/\.jpg/)>-1)
													{
														val="<a href='"+val+"' target='_blank'><img src='"+val+"' height='20' width='20' /></a>";
													}
													else
													{
														val="<a href='"+val+"' target='_blank'>link</a>";
													}
												}
												else
												{
													val=val.replace(/ 12:00 AM/g,"");
												}
											}
											
											// Formatting the cells for attribute display in a tidy table
											item_array.push({html:"<div style='font-size:8pt;'><font color='#666666'>"+trim(lab)+"</font></div>"});
											item_array.push({html:"<div style='font-size:10pt;'>"+trim(val)+"</div>"});
										}
																													
										var win = new Ext.Panel({
											id:'tblayout-win'
											//,width:227
											,layout:'table'
											,layoutConfig:{columns:2}
											,border:false
											//,closable:false
											,defaults:{height:20}
											,renderTo: e2
											,items: item_array
										});
									},
								    scope:this}
						    
							})
						]}),
						
				new Ext.Panel({
					border: false,
					layout: 'fit',
					width: 35,
					height: 22,
					items: [
							new Ext.Button({
								text: gtClearButton,
								handler: clear_highlight
							})
					]
				})
			]
		});

		var accordion = new Ext.Panel({
			//title: 'Accordion Layout',
			id:'gtAccordion',
			layout:'accordion',
			region: "center",
			border: false,
			collapsible: false,
			autoScroll:true,
			defaults: {
				// applied to each contained panel
				bodyStyle: " background-color: transparent ",
				collapsed: true,
				listeners:{
					scope: this,
					expand:function(p){
						// Updating the index of the currently opened tab
						for(k in p.ownerCt.items.items)
						{	
							if (p.ownerCt.items.items[k].id==p.id)
							{
								var cb = Ext.getCmp('gtInfoCombobox');
								// Layer name of the currently selected item in the combo
								gCurrentExpandedTabIdx[cb.getStore().data.items[cb.getStore().find("type",cb.getValue())].data.layer] = k;
								break;
							}
						}
						
						// Sending in the query to populate this specific tab (tab on demand)
						// Could be further refined by keeping track of which tab has already been opened, so that we don't re-request the data
						
						// Current layer, as per content of the drop down
						var cl = cb.getStore().data.items[cb.getStore().find("type",cb.getValue())].data.layer;
/*						
						if (gCurrentExpandedTabIdx[cl] != 0)
						{
							//alert("Requesting data on demand!");
							var configArray = gLayoutsArr[cl];
							if (configArray)
							{
								// This could be further refined by sending only the query corresponding to the open accordion part
								for (var i=gCurrentExpandedTabIdx[cl]-1; i< gCurrentExpandedTabIdx[cl]; i++)
								{
									var g=0;
									
									// Adding a loading indicator for user feedback		
									var targ2 = Ext.get(Ext.getCmp(configArray[i].id).body.id).dom;

									// If data already exists, we remove it for replacement with the latest data
									if (targ2.hasChildNodes())
									{
										targ2.removeChild(targ2.firstChild);
									}

									// Rendering as a table
									var win2 = new Ext.Panel({
										id:'tblayout-win-loading'
										//,width:227
										,layout:'hbox'
										,layoutConfig: {
											padding:'5',
											pack:'center',
											align:'middle'
										}
										,border:false
										,defaults:{height:26}
										,renderTo: targ2
										,items: [
											{html:'<img src="/externals/ext/resources/images/default/grid/loading.gif"/>',border:false,padding:'5'}
										]
									});
									
									// Finding the unique ID of the selected record, to pass to the live query
									var selectedRecordIndex = cb.selectedIndex;	
									if ((selectedRecordIndex==-1) || (selectedRecordIndex>=cb.store.data.items.length))
									{
										selectedRecordIndex=0;
									}
									var idFeature = cb.store.data.items[selectedRecordIndex].data.content[configArray[i].idName];

									if (configArray[i].id.substring(0,1)!='X')
									{
										// Live query using the script tag
										var ds = new Ext.data.Store({
											autoLoad:true,
											proxy: new Ext.data.ScriptTagProxy({
												url: gtGetLiveDataEndPoints[configArray[i].definition].urlLiveData
											}),
											reader: new Ext.data.JsonReader({	
												root: 'rows',
												totalProperty: 'total_rows',
												id: 'id'	
												}, 
												[	{name: 'id', mapping: 'row.id'}
											]),
											baseParams: {
												// Logged in role
												role: gCurrentLoggedRole,
												// Passing the value of the property defined as containing the common ID
												id: idFeature,
												// Passing the tab name
												infoGroup: configArray[i].id,
												// Passing the database type to query
												mode: gtGetLiveDataEndPoints[configArray[i].definition].storeMode,
												// Passing the database name to query
												config: gtGetLiveDataEndPoints[configArray[i].definition].storeName,
												// Passing the LGA code, so that the query can be narrowed down (unused)
												lga: gtLGACode
											},
											listeners:
											{
												load: function(store, recs)
												{
													// Looping thru the records returned by the query
													tab_array = new Array();
													for (m = 0 ; m < recs.length; m++)
													{
														res_data = recs[m].json.row;
														var item_array2 = new Array();
														var has_gsv = false;		

														for (j in res_data)
														{
															if (j!="target")
															{
																var val=res_data[j];
																if (val.search(/^http/)>-1)
																{
																	if (val.search(/\.jpg/)>-1)
																	{
																		val="<a href='"+val+"' target='_blank'><img src='"+val+"' height='20' width='20' /></a>";
																	}
																	else
																	{
																		val="<a href='"+val+"' target='_blank'>link</a>";
																	}
																}
																else
																{
																	val=val.replace(/ 12:00 AM/g,"");
																}	

																if (j.search(/^gsv/)>-1)
																{
																	// Not showing the cells - technical properties for Google Street View
																	has_gsv = true;
																}
																else
																{																			// Formatting the cells for attribute display in a tidy table
																	item_array2.push({html:"<div style='font-size:8pt;'><font color='#666666'>"+j+"</font></div>"});
																	item_array2.push({html:"<div style='font-size:10pt;'>"+val+"</div>"});
																}
															}
														}

														// Adding a Google Street View link for selected datasets
														if (has_gsv)
														{
															var gsv_lat, gsv_lon, gsv_head=0;

															for(var k in res_data)
															{
																if (k=="gsv_lat")
																{
																	gsv_lat=res_data[k];
																}
																if (k=="gsv_lon")
																{
																	gsv_lon=res_data[k];
																}
																if (k=="gsv_head")
																{
																	gsv_head=res_data[k];
																}												
															}

															if (gsv_lat && gsv_lon)
															{
																// Adjusted to the size of the column
																var size_thumb = 245;
																var gsvthumb = "http://maps.googleapis.com/maps/api/streetview?location="+gsv_lat+","+gsv_lon+"&fov=90&heading="+gsv_head+"&pitch=-10&sensor=false&size="+size_thumb+"x"+size_thumb;
																var gsvlink = "http://maps.google.com.au/maps?layer=c&cbll="+gsv_lat+","+gsv_lon+"&cbp=12,"+gsv_head+",,0,0";
																item_array2.push({html:"<div style='font-size:10pt;'><a href='"+gsvlink+"' target='_blank'><img src='"+gsvthumb+"'/></a></div>",height:size_thumb,colspan:2});											
															}
														}

														tab_el = {
															title	: m+1,
															layout	: 'table',
															defaults:{height:20},
															layoutConfig:{columns:2},
															items	: item_array2
														};

														tab_array.push(tab_el);
													}	

													// Identification of the div to render the attributes to, if there is anything to render
													if (recs[0])
													{
														// The target div for placing this data
														var targ = Ext.get(Ext.getCmp(recs[0].json.row["target"]).body.id).dom;
														// If data already exists, we remove it for replacement with the latest data
														if (targ.hasChildNodes())
														{
															targ.removeChild(targ.firstChild);
														}	
													
														// The container depends on the number of records returned
														if (tab_array.length==1)
														{
															// Rendering as a table
															var win = new Ext.Panel({
																id:'tblayout-win'+g
																//,width:227
																,layout:'table'
																,layoutConfig:{columns:2}
																,border:false
																//,closable:false
																,defaults:{height:20}
																,renderTo: targ
																,items: tab_array[0].items
															});
														}
														else
														{
															// Renderng as a tab panel of tables
															var win = new Ext.TabPanel({
																activeTab       : 0,
																id              : 'tblayout-win'+g,
																enableTabScroll : true,
																resizeTabs      : false,
																minTabWidth     : 15,																
																border:false,
																renderTo: targ,
																items: tab_array
															});
														}
														win.doLayout();	
													}
													else
													{
														// The target div for placing this data: the loading div's parent
														var targ = Ext.get(Ext.getCmp('tblayout-win-loading').body.id).dom.parentNode;
														// If data already exists, we remove it for replacement with the latest data
														if (targ.hasChildNodes())
														{
															targ.removeChild(targ.firstChild);
														}
													
														// Rendering as a table
														var win3 = new Ext.Panel({
															id:'tblayout-win-noresult'
															//,width:227
															,layout:'hbox'
															,layoutConfig: {
																padding:'5',
																pack:'center',
																align:'middle'
															}
															,border:false
															,defaults:{height:26}
															,renderTo: targ
															,items: [
																{html:'<p style="font-size:12px;">No result found</p>',border:false,padding:'5'}
															]
														});
														win3.doLayout();
													}
													g++;
												}
											}
										});
									}
									else
									{
										// Rendering a generic tab based on its HTML definition
										// The target div for placing this data: the loading div's parent
										var targ3 = Ext.get(Ext.getCmp('tblayout-win-loading').body.id).dom.parentNode.parentElement.parentElement;
										// If data already exists, we remove it for replacement with the latest data
										if (targ3.hasChildNodes())
										{
											targ3.removeChild(targ3.firstChild);
										}
									
										// Rendering as a table
										var win4 = new Ext.Panel({
											id:'tblayout-win-generic'
											//,width:227
											,layout:'fit'
											,border:false
//											,defaults:{height:100%}
											,renderTo: targ3
											,items: [
												{html:configArray[i].html}
											]
										});
										win4.doLayout();
									}
								}

							}							
						}
									*/																
						
					}
				}
			},
			layoutConfig: {
				// layout-specific configs go here
				animate: false,
				titleCollapse: true,
				activeOnTop: false,
				hideCollapseTool: false,
				fill: false 
			},
			items: [{
				title: gtDetailsTitle,
				html: '<p></p>',
				autoScroll: true
			}]
		});
        
		var eastPanel = new Ext.Panel({
			border: false,
			layout: "border",
			region: "east",
			title: gtInfoTitle,
			collapsible: true,
			collapseMode: "mini",
			width: 250,
			split: true,
			items: [
				northPart,
				accordion
			]
		});

		var portalItems = [
		{
			region: "north",
			layout: "column",
			height: 100,
			footerCfg: {
				// Required to have the footer display
				html: '<p style="font-size:8px;"><br></p>'
			},
			footerStyle:'background-color:'+gtBannerLineColor+';border:0px;',
			// Removes the grey border around the footer (and around the whole container body)
			bodyStyle:'border:0px;',
			items:
				[
				new Ext.BoxComponent({
				region: "west",
					width: gtLogoClientWidth,
					bodyStyle: " background-color: transparent ",
					html: '<img style="height: 90px" src="'+gtLogoClientSrc+'" align="right"/>'
				})
				,
				{
					columnWidth: 0.5,
					html:"",
					height: 100,
					border:false
				}
				,
				new Ext.Panel({
					region: "center",
					width: 500,
					padding: "34px",
					border: false,
					bodyStyle: " background-color: white ; ",
					items: [
						new Ext.form.ComboBox({
							id: 'gtSearchCombobox',
							queryParam: 'query',
							store: ds,
							displayField:'label',
							selectOnFocus: true,
							minChars: 3,
							typeAhead: false,
							loadingText: gtLoadingText,
							width: 450,
							style: "border: 2px solid #BBBBBB; width: 490px; height: 24px; font-size: 11pt;",
							pageSize:0,
							emptyText:gtEmptyTextSearch,
							hideTrigger:true,
							tpl: '<tpl for="."><div class="search-item" style="height: 28px;"><font color="#666666">{ld}</font> : {[values.label.replace(new RegExp( "(" +  Ext.get(\'gtSearchCombobox\').getValue()  + ")" , \'gi\' ), "<b>$1</b>" )]} <br></div></tpl>',
							itemSelector: 'div.search-item',
							listeners: {'select': search_record_select_handler,scope:this}
						})
					]
				})
				,
				{
					columnWidth: 0.5,
					html:"",
					height: 100,
					border:false
				}
				,

				new Ext.Panel({
					region: "east",
					border: false,
					width: 200,
					height: 100,
					bodyStyle: " background-color: transparent; ",
					html: '<p style="text-align:right;padding: 15px;font-size:12px;"><a href="'+gtLinkToCouncilWebsite+'" target="_blank">'+ gtBannerRightCornerLine1 +'</a><br> '+ gtBannerRightCornerLine2 +' <br><br>Map powered by <a href="javascript:poziLinkClickHandler()">Pozi</a></p>'

				})
				]
		},
		{
		// HS MOD END
		    region: "center",
		    layout: "border",
		    tbar: this.toolbar,
		    items: [
			{
				id: "centerpanel",
				xtype: "panel",
				layout: "fit",
				region: "center",
				border: false,
				items: ["mymap"]
			},
			westPanel,
			eastPanel
		    ]}
		];

		app = new gxp.Viewer({
//			proxy: "proxy/?url=",
			proxy: "/geoexplorer/proxy/?url=",
			//defaultSourceType: "gxp_wmscsource",
			portalConfig: {
				layout: "border",
				region: "center",
				// by configuring items here, we don't need to configure portalItems and save a wrapping container
				items: portalItems,
				bbar: {id: "mybbar"}
			},
			// configuration of all tool plugins for this application
			tools: JSONconf.tools,
			// layer sources
			sources: JSONconf.sources,
			// map and layers
			map: {
				id: "mymap", // id needed to reference map in portalConfig above
				projection: "EPSG:900913",
				center: JSONconf.center,
				zoom: JSONconf.zoom,
				layers: JSONconf.layers ,
				items: [{
						xtype: "gx_zoomslider",
						vertical: true,
						height: 100
				}]
			}
		});
		
		app.on("ready", function() {
			//alert('Now');
			// This is when we want to find the handle to the WFS layer
			for(x in app.mapPanel.layers.data.items) {
				var u = app.mapPanel.layers.data.items[x];
				if (u.data)
				{
					// Assigning the selection layer to a global variable for easier access
					if (u.data.name == "Selection")
					{
						glayerLocSel = u.getLayer();
					}
				}
			};
			
//			alert('Done');
		});
		
	};

	// Loading the extra Javascript if the configuration file contains a name
	if (JSONconf.customJS)
	{
		loadjscssfile('lib/custom/js/'+JSONconf.customJS,extraJSScriptLoaded);
	}
	else
	{
		extraJSScriptLoaded();
	}

});
