addOpacitySlider = function(app) {

    if (app.getLayerForOpacitySlider()) {
        
        _([
            new Ext.form.Label({ text: "Aerial Photo", style: 'font: normal 13px verdana' }),
            new Ext.Toolbar.Spacer({ width: 8 }),
            new Ext.Component({ html: '<img src="theme/app/img/panel/eye-con.png"/>' }),
            new Ext.Toolbar.Spacer({ width: 8 }),
            new GeoExt.LayerOpacitySlider({ id:'geoExtOpacitySlider', layer: app.getLayerForOpacitySlider(), aggressive: true, width: 100, changeVisibility: true })
        ]).each(function(newItem) {
            app.getToolbar().items.add(newItem);
        });

        app.getToolbar().doLayout();
    }

};

