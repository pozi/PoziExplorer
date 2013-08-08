buildAccordion = function(gCurrentExpandedTabIdx, gLayoutsArr, tabExpand) {

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
