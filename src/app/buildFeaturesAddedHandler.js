buildFeaturesAddedHandler = function(gfromWFSFlag, gComboDataArray, gCombostore) {

    return function(event) {

        if (gfromWFSFlag.value == "Y") {
            var row_array = [];
            var cont;
            gComboDataArray.value = [];

            for (var k = 0; k < this.features.length; k++) {

                // We capture the attributes brought back by the WFS call
                cont = this.features[k].data;
                // Capturing the feature as well (it contains the geometry)
                cont["the_geom_WFS"] = this.features[k];

                var o = app.getSelectionLayer().myGtObject;
                // If too long for the drop down, we truncate the string to the space remaining after "<LAYER NAME>:"
                var num_char_in_drop_down = 38;
                if (o.featureLabel.length > num_char_in_drop_down - o.featureType.length) {
                    o.featureLabel = o.featureLabel.substring(0, num_char_in_drop_down - o.featureType.length - 2) + "..";
                }

                // Building a record and inserting it into an array
                row_array = new Array(k, o.featureType, cont, 0, o.featureLabel, o.layerName);
                gComboDataArray.value.push(row_array);

            }

            // Clearing existing value from the drop-down list
            var cb = Ext.getCmp('gtInfoCombobox');
            cb.clearValue();

            // If there is a record (and there should be at least one - by construction of the search table)
            if (gComboDataArray.value.length) {
                if (cb.disabled) {
                    cb.enable();
                }
                gCombostore.removeAll();
                gCombostore.loadData(gComboDataArray.value);
                gComboDataArray.value = [];
            }
        }

    };

};

