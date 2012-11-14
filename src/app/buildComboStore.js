buildComboStore = function() {

    return new Ext.data.ArrayStore({
        storeId: 'myStore',
        idIndex: 0,
        fields: [
            'id',
            'type',
            'content',
            'index',
            'label',
            'layer',
            {
                name: 'labelx',
                convert: function(v, rec) {
                    return helpers.toSmartTitleCase(rec[4]);
                }
            }
        ],
        listeners: {
            load: function(ds, records, o) {
                var cb = Ext.getCmp('gtInfoCombobox');
                var rec = records[0];
                if (records.length > 1) {
                    // Multiple records, color of the combo background is different
                    cb.removeClass("x-form-single");
                    cb.addClass("x-form-multi");
                } else {
                    // Restoring the color to a normal white
                    cb.removeClass("x-form-multi");
                    cb.addClass("x-form-single");

                    // Collapsing the drop down
                    cb.collapse();
                }
                cb.setValue(rec.data.labelx);
                cb.fireEvent('select', cb, rec);
            },
            scope: this
        }
    });

};
