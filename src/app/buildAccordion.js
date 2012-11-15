buildAccordion = function(gtLayerLabel, gCurrentExpandedTabIdx, gLayoutsArr, tabExpand) {

    var tabCollapse = function(p) {
        // Current layer (cl) as per content of the current type (ct) and current drop down (cb)
        var ct = gtLayerLabel;
        // that contains the type of the currently selected feature
        var cb = Ext.getCmp('gtInfoCombobox');
        // the Ext JS component containing the combo - used to link type to layer name
        var cl;
        // If the item can be found, then we extract the layer name
        if (cb.getStore().data.items[cb.getStore().find("type", ct)]) {
            cl = cb.getStore().data.items[cb.getStore().find("type", ct)].data.layer;
        } else { 
            // There is no item in the drop down and the current layer is "NONE"
            cl = "NONE";
        }

        if (gCurrentExpandedTabIdx[cl] != 0) {
            var configArray = gLayoutsArr[cl];

            if (configArray) {
                // This only performs the query corresponding to the currently open tab
                for (var i = gCurrentExpandedTabIdx[cl] - 1; i < gCurrentExpandedTabIdx[cl]; i++) {
                    // Triggering the tab-wide actions
                    if (configArray[i].onTabClose) {
                        // Avoiding the use of the 'eval' function
                        var fn = window[configArray[i].onTabClose];
                        if (typeof fn === 'function') {
                            // Context passed: the id of the clicked feature
                            fn();
                        }
                    }
                }
            }
        }
    };

    return new Ext.Panel({
        id: 'gtAccordion',
        layout: 'accordion',
        region: "center",
        border: false,
        rowHeight: 1,
        collapsible: false,
        autoScroll: true,
        defaults: {
            // applied to each contained panel
            bodyStyle: " background-color: transparent ",
            style: "padding:10px 0px 0px;",
            collapsed: true,
            listeners: {
                scope: this,
                expand: tabExpand,
                collapse: tabCollapse
            }
        },
        layoutConfig: {
            // layout-specific configs go here
            animate: false,
            titleCollapse: true,
            activeOnTop: false,
            hideCollapseTool: false,
            fill: false
        }
    });

}
