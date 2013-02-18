buildWestPanel = function(JSONconf) {

    return Ext.create({
        xtype: "panel",
        id: "westpanel",
        border: false,
        layout: "anchor",
        region: "west",
        width: 250,
        split: true,
        border: true,
        collapsible: true,
        collapseMode: "mini",
        collapsed: JSONconf.collapseWestPanel,
        hideCollapseTool: true,
        autoScroll: true,
        // Only padding on the right as all other sides covered by the parent container
        style: "padding: 0px 10px 0px 0px; background-color:white;",
        headerCfg: {
            // Required to have the footer display
            html: '<p style="font-size:16px;font-family: tahoma,arial,verdana,sans-serif;">Layers</p>',
            bodyStyle: " background-color: white; "
        },
        headerStyle: 'background-color:' + JSONconf.bannerLineColor + ';border:0px; margin:0px 0px 0px; padding: 5px 8px;',
        items: [

        ]
    });

};

