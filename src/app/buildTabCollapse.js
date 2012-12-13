buildTabCollapse = function(gtLayerLabel, gCurrentExpandedTabIdx, gLayoutsArr) {

    return function(p) {
        // Current layer (cl) as per content of the current type (ct) and current drop down (cb)
        var ct = gtLayerLabel.value;
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
};