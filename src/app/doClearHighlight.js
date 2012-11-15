// Remove the WFS highlight, clear and disable the select feature combo, empty the combostore and clean the details panel
doClearHighlight = function(app, gCombostore, addDefaultTabs, accordion, gLayoutsArr, JSONconf, northPart) {
    // Removing the highlight by clearing the selected features in the WFS layer
    app.getSelectionLayer().removeAllFeatures();
    app.getSelectionLayer().redraw();
    // Clearing combo
    var cb = Ext.getCmp('gtInfoCombobox');
    cb.collapse();
    cb.clearValue();
    cb.disable();
    cb.removeClass("x-form-multi");
    cb.addClass("x-form-single");

    // Removing all values from the combo
    gCombostore.removeAll();

    // Add default tabs
    addDefaultTabs(accordion, gLayoutsArr, JSONconf);

    // Hiding the north part of the east panel
    northPart.setHeight(30);
    cb.setVisible(false);

    // Clearing the feature type
    Ext.get('gtInfoTypeLabel').dom.innerHTML = "&nbsp;";

};

