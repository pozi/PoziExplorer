// Overriding the printing encoder
// to cater for non-simple WMTS layers
// especially the content of matrixIds and format

GeoExt.data.PrintProvider.prototype.encoders = {
    "layers": {
        "Layer": function(layer) {
            var enc = {};
            if (layer.options && layer.options.maxScale) {
                enc.minScaleDenominator = layer.options.maxScale;
            }
            if (layer.options && layer.options.minScale) {
                enc.maxScaleDenominator = layer.options.minScale;
            }
            return enc;
        },
        "WMS": function(layer) {
            var enc = this.encoders.layers.HTTPRequest.call(this, layer);
            Ext.apply(enc, {
                type: 'WMS',
                layers: [layer.params.LAYERS].join(",").split(","),
                format: layer.params.FORMAT,
                styles: [layer.params.STYLES].join(",").split(",")
            });
            var param;
            for(var p in layer.params) {
                param = p.toLowerCase();
                if(!layer.DEFAULT_PARAMS[param] &&
                "layers,styles,width,height,srs".indexOf(param) == -1) {
                    if(!enc.customParams) {
                        enc.customParams = {};
                    }
                    enc.customParams[p] = layer.params[p];
                }
            }
            return enc;
        },
        "OSM": function(layer) {
            var enc = this.encoders.layers.TileCache.call(this, layer);
            return Ext.apply(enc, {
                type: 'OSM',
                baseURL: enc.baseURL.substr(0, enc.baseURL.indexOf("$")),
                extension: "png"
            });
        },
        "TMS": function(layer) {
            var enc = this.encoders.layers.TileCache.call(this, layer);
            return Ext.apply(enc, {
                type: 'TMS',
                format: layer.type
            });
        },
        "TileCache": function(layer) {
            var enc = this.encoders.layers.HTTPRequest.call(this, layer);
            return Ext.apply(enc, {
                type: 'TileCache',
                layer: layer.layername,
                maxExtent: layer.maxExtent.toArray(),
                tileSize: [layer.tileSize.w, layer.tileSize.h],
                extension: layer.extension,
                resolutions: layer.serverResolutions || layer.resolutions
            });
        },
        "WMTS": function(layer) {
            var enc = this.encoders.layers.HTTPRequest.call(this, layer);

            var len = layer.matrixIds.length;
            var mids = new Array(len);
            if (len && typeof layer.matrixIds[0] !== "string") {
                for (var i=0; i<len; ++i) {
                    mids[i] = {
                        identifier: layer.matrixIds[i].identifier,
                        matrixSize: [layer.matrixIds[i].matrixWidth,layer.matrixIds[i].matrixHeight],
                        tileSize: [layer.matrixIds[i].tileSize.w,layer.matrixIds[i].tileSize.h],
                        topLeftCorner: [layer.matrixIds[i].topLeftCorner.lon,layer.matrixIds[i].topLeftCorner.lat],
                        resolution: layer.matrixIds[i].resolution
                    }
                }
            }

            return Ext.apply(enc, {
                type: 'WMTS',
                layer: layer.layer,
                version: layer.version,
                requestEncoding: layer.requestEncoding,
                tileOrigin: [layer.tileOrigin.lon, layer.tileOrigin.lat],
                tileSize: [layer.tileSize.w, layer.tileSize.h],
                style: layer.style,
                formatSuffix: layer.formatSuffix,
                format: layer.format,
                matrixIds: mids,
                dimensions: layer.dimensions,
                params: layer.params,
                maxExtent: (layer.tileFullExtent != null) ? layer.tileFullExtent.toArray() : layer.maxExtent.toArray(),
                matrixSet: layer.matrixSet,
                zoomOffset: layer.zoomOffset,
                resolutions: layer.serverResolutions || layer.resolutions
            });
        },
        "KaMapCache": function(layer) {
            var enc = this.encoders.layers.KaMap.call(this, layer);
            return Ext.apply(enc, {
                type: 'KaMapCache',
                // group param is mandatory when using KaMapCache
                group: layer.params['g'],
                metaTileWidth: layer.params['metaTileSize']['w'],
                metaTileHeight: layer.params['metaTileSize']['h']
            });
        },
        "KaMap": function(layer) {
            var enc = this.encoders.layers.HTTPRequest.call(this, layer);
            return Ext.apply(enc, {
                type: 'KaMap',
                map: layer.params['map'],
                extension: layer.params['i'],
                // group param is optional when using KaMap
                group: layer.params['g'] || "",
                maxExtent: layer.maxExtent.toArray(),
                tileSize: [layer.tileSize.w, layer.tileSize.h],
                resolutions: layer.serverResolutions || layer.resolutions
            });
        },
        "HTTPRequest": function(layer) {
            var enc = this.encoders.layers.Layer.call(this, layer);
            return Ext.apply(enc, {
                baseURL: this.getAbsoluteUrl(layer.url instanceof Array ?
                    layer.url[0] : layer.url),
                opacity: (layer.opacity != null) ? layer.opacity : 1.0,
                singleTile: layer.singleTile
            });
        },
        "Image": function(layer) {
            var enc = this.encoders.layers.Layer.call(this, layer);
            return Ext.apply(enc, {
                type: 'Image',
                baseURL: this.getAbsoluteUrl(layer.getURL(layer.extent)),
                opacity: (layer.opacity != null) ? layer.opacity : 1.0,
                extent: layer.extent.toArray(),
                pixelSize: [layer.size.w, layer.size.h],
                name: layer.name
            });
        },
        "Vector": function(layer) {
            if(!layer.features.length) {
                return;
            }
            
            var encFeatures = [];
            var encStyles = {};
            var features = layer.features;
            var featureFormat = new OpenLayers.Format.GeoJSON();
            var styleFormat = new OpenLayers.Format.JSON();
            var nextId = 1;
            var styleDict = {};
            var feature, style, dictKey, dictItem, styleName;
            for(var i=0, len=features.length; i<len; ++i) {
                feature = features[i];
                style = feature.style || layer.style ||
                layer.styleMap.createSymbolizer(feature,
                    feature.renderIntent);
                dictKey = styleFormat.write(style);
                dictItem = styleDict[dictKey];
                if(dictItem) {
                    //this style is already known
                    styleName = dictItem;
                } else {
                    //new style
                    styleDict[dictKey] = styleName = nextId++;
                    if(style.externalGraphic) {
                        encStyles[styleName] = Ext.applyIf({
                            externalGraphic: this.getAbsoluteUrl(
                                style.externalGraphic)}, style);
                    } else {
                        encStyles[styleName] = style;
                    }
                }
                var featureGeoJson = featureFormat.extract.feature.call(
                    featureFormat, feature);
                
                featureGeoJson.properties = OpenLayers.Util.extend({
                    _gx_style: styleName
                }, featureGeoJson.properties);
                
                encFeatures.push(featureGeoJson);
            }
            var enc = this.encoders.layers.Layer.call(this, layer);                
            return Ext.apply(enc, {
                type: 'Vector',
                styles: encStyles,
                styleProperty: '_gx_style',
                geoJson: {
                    type: "FeatureCollection",
                    features: encFeatures
                },
                name: layer.name,
                opacity: (layer.opacity != null) ? layer.opacity : 1.0
            });
        },
        "Markers": function(layer) {
            var features = [];
            for (var i=0, len=layer.markers.length; i<len; i++) {
                var marker = layer.markers[i];
                var geometry = new OpenLayers.Geometry.Point(marker.lonlat.lon, marker.lonlat.lat);
                var style = {externalGraphic: marker.icon.url,
                    graphicWidth: marker.icon.size.w, graphicHeight: marker.icon.size.h,
                    graphicXOffset: marker.icon.offset.x, graphicYOffset: marker.icon.offset.y};
                var feature = new OpenLayers.Feature.Vector(geometry, {}, style);
                features.push(feature);
        }
            var vector = new OpenLayers.Layer.Vector(layer.name);
            vector.addFeatures(features);
            var output = this.encoders.layers.Vector.call(this, vector);
            vector.destroy();
            return output;
        }
    },
    "legends": {
        "gx_wmslegend": function(legend, scale) {
            var enc = this.encoders.legends.base.call(this, legend);
            var icons = [];
            for(var i=1, len=legend.items.getCount(); i<len; ++i) {
                var url = legend.items.get(i).url;
                if(legend.useScaleParameter === true &&
                   url.toLowerCase().indexOf(
                       'request=getlegendgraphic') != -1) {
                    var split = url.split("?");
                    var params = Ext.urlDecode(split[1]);
                    params['SCALE'] = scale;
                    url = split[0] + "?" + Ext.urlEncode(params);
                }
                icons.push(this.getAbsoluteUrl(url));
            }
            enc[0].classes[0] = {
                name: "",
                icons: icons
            };
            return enc;
        },
        "gx_urllegend": function(legend) {
            var enc = this.encoders.legends.base.call(this, legend);
            enc[0].classes.push({
                name: "",
                icon: this.getAbsoluteUrl(legend.items.get(1).url)
            });
            return enc;
        },
        "base": function(legend){
            return [{
                name: legend.getLabel(),
                classes: []
            }];
        }
    }
};
