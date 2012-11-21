buildFeaturesAddedHandler = function(gfromWFSFlag, gComboDataArray, glab, gtyp, gCombostore) {

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

                // If too long for the drop down, we truncate the string to the space remaining after "<LAYER NAME>:"
                var num_char_in_drop_down = 38;
                if (glab.value.length > num_char_in_drop_down - gtyp.value.length) {
                    glab.value = glab.value.substring(0, num_char_in_drop_down - gtyp.value.length - 2) + "..";
                }

                // Building a record and inserting it into an array											
                //row_array = new Array(k,typ,lab,cont,null,null,this.features[k].layer.protocol.featureType);
                row_array = new Array(k, gtyp.value, cont, 0, glab.value, this.features[k].layer.protocol.featureType);
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

