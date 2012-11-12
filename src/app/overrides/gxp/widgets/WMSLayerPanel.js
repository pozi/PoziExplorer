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

