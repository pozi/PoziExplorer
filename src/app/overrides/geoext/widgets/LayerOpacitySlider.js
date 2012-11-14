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
  if ((this.inverse === false && value == this.minValue) || (this.inverse === true && value == this.maxValue) && currentVisibility === true) 
    {
      this.layer.setVisibility(false);

      // Selecting the none layer within the aerial group
      for (l in app.mapPanel.map.layers) {
        if (app.mapPanel.map.layers[l].name == "No Aerial") {
          app.mapPanel.map.layers[l].setVisibility(true);
          break;
        }
      }

  } else if ((this.inverse === false && value > this.minValue) || (this.inverse === true && value < this.maxValue) && currentVisibility == false) 
    {
      this.layer.setVisibility(true);
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
    
    // When below 10% opacity, we set the slider value to 0
    if (value > 0.1)
    {
      this._settingOpacity = true;
      this.layer.setOpacity(value);
      delete this._settingOpacity;
    }
    else
    {
      this.setValue(this.minValue);
    }
  }
}