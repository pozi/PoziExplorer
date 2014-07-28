/** private: method[changeLayerVisibility]
 *  :param slider: :class:`GeoExt.LayerOpacitySlider`
 *  :param value: ``Number`` The slider value
 *
 *  Updates the ``OpenLayers.Layer`` visibility.
 */
// Reasons for override:
// - selection of the "No Aerial" when opacity is back to 0    
    
GeoExt.LayerOpacitySlider.prototype.changeLayerVisibility = function(slider, value) {
  var currentVisibility = this.layer.getVisibility();
  if ((this.inverse === false && value == this.minValue) || (this.inverse === true && value == this.maxValue)) 
  {
    if (currentVisibility)
    {
      // Selecting the none layer within the aerial group
      for (l in app.mapPanel.map.layers) {
        if (app.mapPanel.map.layers[l].name == "No Aerial") {
          //app.mapPanel.map.layers[l].setOpacity(0);
          app.mapPanel.map.layers[l].setVisibility(true);
          break;
        }
      }

      this.layer.setVisibility(false);
      this.layer.setOpacity(0);

      // Setting the visible flag of the layer combo record to false
      var os = Ext.getCmp('opacitySliderCombo');
      if (os)
      {
        var r = os.findRecord('id',os.getValue());
        if (r)
        {
          r.set("visible",false);
        }
      }

    }
  } 
  else
    if ((this.inverse === false && value > this.minValue) || (this.inverse === true && value < this.maxValue)) 
    {
      if (!currentVisibility)
      {
        // Setting the visible flag of the layer combo record to true
        var os = Ext.getCmp('opacitySliderCombo');
        if (os)
        {
          var r = os.findRecord('id',os.getValue());
          if (r)
          {
            r.set("visible",true);
          }
        }
        this.layer.setVisibility(true);
      }
    }
  else
  {
    //return true;
  }
};



/** private: method[changeLayerOpacity]
*  :param slider: :class:`GeoExt.LayerOpacitySlider`
*  :param value: ``Number`` The slider value
*
*  Updates the ``OpenLayers.Layer`` opacity value.
*/
// Reasons for override:
// - switching off aerial imagery if opacity less than 10    

GeoExt.LayerOpacitySlider.prototype.changeLayerOpacity = function(slider, value) {
  if (this.layer) {
    value = value / (this.maxValue - this.minValue);
    if (this.inverse === true) {
	value = 1 - value;
    }
    
    // When below 2% opacity, we set the slider value to 0
    if (value > 0.02)
    {
      var that = this;
      this._settingOpacity = true;
      this.layer.setOpacity(value);
      delete this._settingOpacity;

      // Here, we should adjust the opacity of all layers in the same exclusive group
      var os = Ext.getCmp('opacitySliderCombo'), g, e, r;
      if (os)
      {
        r = os.findRecord('id',os.getValue());
        if (r)
        {
          g = r.get("group") || "default";
          e = r.get("exclusive");
          if (e)
          {
            _(JSONconf.layers).each(function(l){
              if (l.group == g)
              {
                if (l.title && l.title != "No Aerial" && l.title != that.layer.name)
                {
                  app.mapPanel.map.getLayersByName(l.title)[0].setOpacity(value);
                }
              }
            });
          }          
        }
      }


    }
    else
    {
      this.setValue(this.minValue);
    }
  }
}