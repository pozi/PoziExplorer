gxp.plugins.Measure.prototype.addActions = function() {
    this.activeIndex = 0;
    this.button = new Ext.SplitButton({
        iconCls: "gxp-icon-measure-length",
        tooltip: this.measureTooltip,
        buttonText: this.buttonText,
        enableToggle: true,
        toggleGroup: this.toggleGroup,
        allowDepress: true,
        handler: function(button, event) {
            var isClickOnArrow = function(e){
                var visBtn = button.el.child('em.x-btn-arrow');
                var right = visBtn.getRegion().right - visBtn.getPadding('r');
                return e.getPageX() > right;
            };
            //console.log(isClickOnArrow(event));
            if(!button.disabled){
                if(isClickOnArrow(event)){
                    if(button.menu && !button.menu.isVisible()){
                        button.showMenu();
                    }
                    button.fireEvent("arrowclick", button, event);
                } else {
                    // Not showing the drop down if the arrow has not been pressed
                    button.hideMenu();

                    if (button.pressed)
                    {
                        button.menu.items.itemAt(this.activeIndex).setChecked(true);
                        button.fireEvent("click", button, event);
                    }
                    else
                    {
                        button.menu.items.each(function(i) {
                            i.setChecked(false);
                        });
                    }
                }
            }
        },
        scope: this,
        listeners: {
            toggle: function(button, pressed) {
                // toggleGroup should handle this
                if(!pressed) {
                    button.menu.items.each(function(i) {
                        i.setChecked(false);
                    });
                }
            },
            render: function(button) {
                // toggleGroup should handle this
                Ext.ButtonToggleMgr.register(button);
            }
        },
        menu: new Ext.menu.Menu({
            items: [
                new Ext.menu.CheckItem(
                    new GeoExt.Action({
                        text: this.lengthMenuText,
                        iconCls: "gxp-icon-measure-length",
                        toggleGroup: this.toggleGroup,
                        group: this.toggleGroup,
                        listeners: {
                            checkchange: function(item, checked) {
                                this.activeIndex = 0;
                                this.button.toggle(checked);
                                if (checked) {
                                    this.button.setIconClass(item.iconCls);
                                }
                            },
                            scope: this
                        },
                        map: this.target.mapPanel.map,
                        control: this.createMeasureControl(
                            OpenLayers.Handler.Path, this.lengthTooltip
                        )
                    })
                ),
                new Ext.menu.CheckItem(
                    new GeoExt.Action({
                        text: this.areaMenuText,
                        iconCls: "gxp-icon-measure-area",
                        toggleGroup: this.toggleGroup,
                        group: this.toggleGroup,
                        allowDepress: false,
                        listeners: {
                            checkchange: function(item, checked) {
                                this.activeIndex = 1;
                                this.button.toggle(checked);
                                if (checked) {
                                    this.button.setIconClass(item.iconCls);
                                }
                            },
                            scope: this
                        },
                        map: this.target.mapPanel.map,
                        control: this.createMeasureControl(
                            OpenLayers.Handler.Polygon, this.areaTooltip
                        )
                    })
                )
            ]
        })
    });

    return gxp.plugins.Measure.superclass.addActions.apply(this, [this.button]);
};
