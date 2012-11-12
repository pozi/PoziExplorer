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
