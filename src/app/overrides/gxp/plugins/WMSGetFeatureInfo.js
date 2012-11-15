/** api: constructor
*  .. class:: WMSGetFeatureInfo(config)
*
*    This plugins provides an action which, when active, will issue a
*    GetFeatureInfo request to the WMS of all layers on the map. The output
*    will be displayed in a popup.
*/  
// - activating the control by default and masking its icon


  gxp.plugins.WMSGetFeatureInfo.prototype.addActions = function() {
      this.popupCache = {};
      
      var actions = gxp.plugins.WMSGetFeatureInfo.superclass.addActions.call(this, [{
//            tooltip: this.infoActionTip,
//            iconCls: "gxp-icon-getfeatureinfo",
          buttonText: this.buttonText,
          toggleGroup: this.toggleGroup,
    // The info button does not need to be clickable
    disabled: true,            
          enableToggle: true,
          allowDepress: true,
          toggleHandler: function(button, pressed) {
              for (var i = 0, len = info.controls.length; i < len; i++){
                  if (pressed) {
                      info.controls[i].activate();
                  } else {
                      info.controls[i].deactivate();
                  }
              }
           }
      }]);
      var infoButton = this.actions[0].items[0];

      var info = {controls: []};
      var updateInfo = function() {
          var queryableLayers = this.target.mapPanel.layers.queryBy(function(x){
              //return x.get("queryable");
  return x.get("queryable") && x.get("layer").visibility && (x.get("group") != "background") 
          });

          // Keeping track of the number of objects to be returned
          var layerMax=queryableLayers.length;
          // ID within the combostore must be unique, so we use a counter
          var id_ct=0;
          // Count the number of features within a layer
          var layerCounter = 0;
    
          var map = this.target.mapPanel.map;
          var control;
          for (var i = 0, len = info.controls.length; i < len; i++){
              control = info.controls[i];
              control.deactivate();  // TODO: remove when http://trac.openlayers.org/ticket/2130 is closed
              control.destroy();
          }

          info.controls = [];
          
          queryableLayers.each(function(x){
              var layer = x.getLayer();
              var vendorParams = Ext.apply({}, this.vendorParams), param;
              if (this.layerParams) {
                  for (var i=this.layerParams.length-1; i>=0; --i) {
                      param = this.layerParams[i].toUpperCase();
                      vendorParams[param] = layer.params[param];
                  }
              }
              var infoFormat = x.get("infoFormat");
              if (infoFormat === undefined) {
                  // TODO: check if chosen format exists in infoFormats array
                  // TODO: this will not work for WMS 1.3 (text/xml instead for GML)
                  //infoFormat = this.format == "html" ? "text/html" : "application/vnd.ogc.gml";
                  infoFormat = "text/html";
              }
              var control = new OpenLayers.Control.WMSGetFeatureInfo(Ext.applyIf({
                  // Managing array of URLs
                  url: (typeof layer.url == "object" ? layer.url[0] : layer.url),
                  queryVisible: true,
                  radius: 64,
                  layers: [layer],
                  infoFormat: infoFormat,
                  vendorParams: vendorParams,
                  eventListeners: {
                      getfeatureinfo: function(evt) {
      layerCounter = layerCounter+1;
      var idx=0;
      // Index contains the position of the layer within the tree layer
      for(i=0;i<app.mapPanel.layers.data.items.length;i++)
      {
        if (app.mapPanel.layers.data.items[i]===x) 
        {
          idx=i;
          break;
        }
      }

      // Extract the core of the object, that is the JSON object
      var match = evt.text.match(/<body[^>]*>([\s\S]*)<\/body>/);
      if (match && !match[1].match(/^\s*$/)) {
        // Issue with simple quotes - with the template js_string, they appear as \', which is not parseable as JSON
        res=Ext.util.JSON.decode(match[1].replace('\\\'','\''));

        // We hydrate an object that powers the datastore for the right panel combo
        var row_array;
        for (var i=0;i<res.rows.length;i++)
        {
          // Id - need to be distinct for all objects in the drop down: if several layers activated, must be different across all layers (we can't use looping variable i)
          id_ct++;
          // Type - from the layer name in the layer selector
          var typ=x.data.title;
          // Attempt to format it nicely (removing the parenthesis content)
          var simpleTitle=x.data.title.match(/(.*) ?\(.*\)/);
          if (simpleTitle) { typ = helpers.trim(simpleTitle[1]); }
          // All the attributes are contained in a serialised JSON object
          var cont=res.rows[i].row;

          // Layer name (without namespace), to enable additional accordion panels
          var lay=x.data.layer.params.LAYERS.split(":")[1];
          // Catering for layer groups (they don't have a workspace name as a prefix)
          if (!lay)
          {
            lay=x.data.layer.params.LAYERS;
          }

          // Label									
          var lab='';
          var fti_arr = JSONconf.layerPresentation[lay];
          // We select the right attribute as the label
          if (fti_arr)
          {
            // If the layer presentation is configured, we select the first configured field value
            lab = cont[fti_arr[0].attr_name];
          }
          else
          {
            for (l in cont)
            {						
              // If not, we select the first field that comes along (provided it's not a geometry and it's value is non null)
              if (l!="the_geom" && l!="SHAPE" && l!="projection")
              {
                var lab=cont[l];
                if (lab) 
                {
                  break;
                }
              }
            }							
          }
          // If too long for the drop down, we truncate the string to the space remaining after "<LAYER NAME>:"
          var num_char_in_drop_down = 38;
          if (lab.length>num_char_in_drop_down-typ.length)
          {
            
            lab = lab.substring(0,num_char_in_drop_down-typ.length-2)+"..";
          }

          // Building a row and pushing it to an array																		
          row_array = new Array(id_ct,typ,cont,idx,lab,lay); 

          gComboDataArray.push(row_array);
        }
      }

      // Only to be executed when all queriable layers have been traversed (depends number of layers actually ticked in the layer tree)
      if (layerCounter==layerMax)
      {
        // Remove any previous results						
        clearHighlight();

        if (gComboDataArray.length)
        {
          var cb = Ext.getCmp('gtInfoCombobox');
          if (cb.disabled) {cb.enable();}
          gComboDataArray.sort(function(a,b){return b[3]-a[3]});
          gfromWFSFlag="N";
          gCombostore.loadData(gComboDataArray);
          
          // Features found during the getFeatureInfo: showing the tab
          if (!(JSONconf.hideSelectedFeaturePanel))
          {
            northPart.setHeight(60);
            Ext.getCmp('gtInfoCombobox').setVisible(true);
            // Collapsing the drop-down
            Ext.getCmp('gtInfoCombobox').collapse();
          }
          eastPanel.expand();
        }

        gComboDataArray=[];
        layerCounter=0;
      }
    },
    scope: this
    }
  }, this.controlOptions));
  map.addControl(control);
  info.controls.push(control);
  // Activating the info control by default
  //if(infoButton.pressed) {
    control.activate();
  //}
  }, this);
};

this.target.mapPanel.layers.on("update", updateInfo, this);
this.target.mapPanel.layers.on("add", updateInfo, this);
this.target.mapPanel.layers.on("remove", updateInfo, this);

return actions;
};

