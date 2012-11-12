/** api: method[createStore]
 *
 *  Creates a store of layer records.  Fires "ready" when store is loaded.
 */

// Reasons for override:
// - managing URL parameters that are arrays
// - add a random parameter to burst the cache in IE (for users to see protected layers on page refresh after login in IE)

gxp.plugins.WMSSource.prototype.createStore = function() {
    var baseParams = this.baseParams || {
        SERVICE: "WMS",
        REQUEST: "GetCapabilities"
    };

// Adding random parameter to base params, wherever these base params are coming from        
    baseParams.EXTRA=Math.floor(Math.random()*1000);

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
// - managing store-wide parameters (especially for layers added behind + button)

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

    // Apply store-wide config if none present in the layer config - format, group, tiling and transitionEffect
    if (config && JSONconf.sources[config.source])
    {
      if (!('format' in config))
      {
        if ('defaultType' in JSONconf.sources[config.source])
        {
          config.format=JSONconf.sources[config.source].defaultType;
        }
      }
      if (!('group' in config))
      {
        if ('group' in JSONconf.sources[config.source])
        {
          config.group=JSONconf.sources[config.source].group;
        }
      }
      if (!('tiled' in config))
      {
        if ('tiled' in JSONconf.sources[config.source])
        {
          config.tiled=JSONconf.sources[config.source].tiled;
        }
      }
      if (!('transition' in config))
      {
        if ('transition' in JSONconf.sources[config.source])
        {
          config.transition=JSONconf.sources[config.source].transition;
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
    transitionEffect: ("transition" in config) ? config.transition : null,
//			transitionEffect: singleTile ? null : 'resize',
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

    // Overwriting the queryable attribute if present in config
    if ('queryable' in config)
    {
      data.queryable = config.queryable;
    }

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

