buildEastPanel = function(JSONconf, northPart, accordion) {

    var eastPanel;
    var bottomEastItem = {
        border: false
    };
    if (JSONconf.bottomEastItem) {
        bottomEastItem = {
            id: 'bottomEastItem',
            title: JSONconf.bottomEastItem.title,
            html: "<iframe src='" + JSONconf.bottomEastItem.URL + "' height='" + JSONconf.bottomEastItem.height + "' frameborder='0' />",
            collapsible: true,
            animCollapse: false,
            border: false,
            height: JSONconf.bottomEastItem.height,
            listeners: {
                scope: this,
                expand: function(p) {
                    eastPanel.doLayout(); // TODO: get this just ask its parent to do layout
                },
                collapse: function(p) {
                    eastPanel.doLayout(); // TODO: get this just ask its parent to do layout
                }
            }
        };
    }

    eastPanel = new Ext.Panel({
        border: false,
        layout: "ux.row",
        region: "east",
        // Padding only on the left, as all over basis are covered by the parent container
        style: "padding: 0px 0px 0px 10px; background-color:white;",
        collapseMode: "mini",
        collapsed: JSONconf.eastPanelCollapsed,
        width: 350,
        listeners: {
            scope: this,
            resize: function(p) {
                // This is required to get the content of the accordion tabs to resize
                for (i in p.items.items) {
                    // hasOwnProperty appropriate way to deal with direct property of this object, not inherited ones
                    // In the case on an array, direct members are indexes
                    if (p.items.items.hasOwnProperty(i)) {
                        p.items.items[i].doLayout();
                    }
                }
            }
        },
        split: true,
        items: [
            northPart,
            accordion,
            bottomEastItem
        ]
    });

    return eastPanel;

};

