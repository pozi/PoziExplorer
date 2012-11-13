// Customising the scale combo visibility
gxp.ScaleOverlay.prototype.bind = function(map) {
    this.map = map;
    this.addScaleLine();
    // Hiding the scale combo
    if ('hideScaleCombo' in JSONconf)
    {
        if (! (JSONconf.hideScaleCombo))
        {
            this.addScaleCombo();
        }
    }
    else
    {
        this.addScaleCombo();
    }
    this.doLayout();
};

