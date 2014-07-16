addOpacitySlider = function(app) {

    var layerData = app.getLayersForOpacitySlider();
    var defaultLayer = app.getDefaultLayerForOpacitySlider();

    if (layerData && layerData.length) {
        var layerStore = new Ext.data.JsonStore({
            storeId: 'myLayerComboStore',
            idIndex: 0,
            fields: ['id','val','group','exclusive']
        });
        layerStore.loadData(layerData.reverse());

        // Calculating the width of the drop down
        // Didn't want to do that but seems the easiest right now
        var calculatedWidth = 100, currentValWidth;
        for (j in layerData)
        {
            if (layerData[j].val)
            {
                currentValWidth = layerData[j].val.length * 8;
                if (currentValWidth > calculatedWidth)
                {
                    calculatedWidth = currentValWidth;
                }
            }
        }

        var firstItem;
        // If only 1 layer, use the old label display
        if (layerData.length == 1)
        {
            firstItem = new Ext.form.Label({ text: layerData[0].val, style: 'font: normal 16px verdana; color:#6E6E6E;' });
        }
        else
        {
            firstItem = new Ext.form.ComboBox({
                id:'opacitySliderCombo',
                selectOnFocus: false,
                mode: 'local',
                value: defaultLayer.name,
                allowBlank: false,
                triggerAction: 'all',
                forceSelection: true,
                valueField: 'id',
                displayField: 'val',
                hideTrigger: true,
                width: calculatedWidth,
                store: layerStore,
                // remove the cursor and prevents typing
                editable: false,
                listeners: {
                    'select': function(combo, record) {
                        // Modifying the layer controlled by the opacity slider
                        var os = Ext.getCmp('geoExtOpacitySlider');
                        var o = os.getValue();

                        var layerSelected = app.mapPanel.map.getLayersByName(record.get("val"))[0];
                        os.setLayer(layerSelected);

                        // Managing the exclusivity of the layer just selected
                        if (record.get("exclusive"))
                        {
                            _(JSONconf.layers).each(function(l){
                                if (l.group == record.get("group"))
                                {
                                    if (l.title && l.title != "No Aerial")
                                    {
                                        app.mapPanel.map.getLayersByName(l.title)[0].setVisibility(l.title == record.get("val"));
                                    }
                                }
                            });                            
                        }

                        // Set the opacity to the max if it's not set high enough to show the selected item
                        if (record.get("val") != "No Aerial")
                        {
                            if (o <= os.minValue)
                            {
                                os.setValue(os.maxValue);
                            }
                            else
                            {
                                // If in an exclusive group, we re-use the previous value
                                // That wouldn't be true in a non-exclusive group
                                if (record.get("exclusive"))
                                {
                                    os.setValue(o);
                                }
                            }
                        }
                    },
                    scope: this
                }
            });
        }

        _([
            firstItem,
            new Ext.Toolbar.Spacer({ width: 15 }),
            new Ext.Component({ html: '<img style="width: 20px;" class="transparentImg1" src="theme/app/img/panel/map.svg"/>' }),
            new Ext.Toolbar.Spacer({ width: 4 }),
            new GeoExt.LayerOpacitySlider({ id:'geoExtOpacitySlider', layer: defaultLayer, aggressive: true, width: 100, changeVisibility: true }),
            new Ext.Toolbar.Spacer({ width: 4 }),
            new Ext.Component({ html: '<img style="width: 20px;" class="transparentImg2" src="theme/app/img/panel/map.svg"/>' })
        ]).each(function(newItem) {
            app.getToolbar().items.add(newItem);
        });

        app.getToolbar().doLayout();
    }

};

