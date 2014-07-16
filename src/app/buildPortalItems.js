buildPortalItems = function(JSONconf, buildAllFeaturesDataStore, searchRecordSelectHandler, westPanel, eastPanel) {

    var logoHtml = function() {
        var img ='<img style="height: 70px; padding: 15px;" src="' + JSONconf.logoClientSrc + '" />';
        if (JSONconf.logoClientURL) { return '<a href="' + JSONconf.logoClientURL + '" target="_blank">' + img + '</a>'; }
        else { return img; }
    };

    // Returns an array of stores, the first of which is the aggregated store
    var searchStores = buildAllFeaturesDataStore(JSONconf);

    // Calculating the tool placeholder width based on the number of tools to fit
    var toolWidth = 0;
    _(JSONconf.tools).each(function(tool){
        if (tool.actionTarget == "toolPlaceHolder")
        {
            if (tool.ptype == "gxp_measure") {toolWidth += 36;} else {toolWidth += 24;}
        }  
    });

    var portalItems = [
        {
            region: "north",
            layout: "column",
            height: 100,
            bodyStyle: 'border:0px;',
            items: [
                new Ext.BoxComponent({
                    region: "west",
                    width: 250,
                    bodyStyle: " background-color: transparent;",
                    html: logoHtml()
                }),
                {
                    columnWidth: 0.48,
                    html: "",
                    height: 100,
                    border: false
                },
                new Ext.Panel({
                    region: "center",
                    width: 492,
                    padding: "31px",
                    border: false,
                    bodyStyle: " background-color: white ; ",
                    items: [
                    new Ext.form.ComboBox({
                        id: 'gtSearchCombobox',
                        queryParam: 'query',
                        store: searchStores[0],
                        displayField: 'label',
                        selectOnFocus: true,
                        maxHeight: 400,
                        minChars: 3,
                        typeAhead: false,
                        loadingText: JSONconf.loadingText,
                        width: 450,
                        style: "border-color: " + JSONconf.bannerLineColor + ";",
                        pageSize: 0,
                        emptyText: JSONconf.emptyTextSearch,
                        hideTrigger: true,
                        tpl: '<tpl for="."><div class="search-item" style="height: 28px;"><font color="#666666">{ld}</font> : {[(helpers.toSmartTitleCase(values.label)).replace(new RegExp( "(" +  Ext.get(\'gtSearchCombobox\').getValue()  + ")" , \'gi\' ), "<b>$1</b>" )]} <br></div></tpl>',
                        itemSelector: 'div.search-item',
                        listeners: {
                            'select': function(combo, record) {
                                searchRecordSelectHandler(combo, record, app, JSONconf, northPart, eastPanel);
                            },
                            'beforequery': function(queryEvent) {
                                if (queryEvent.query.length > 2)
                                {
                                    // Removing all records from the aggregate search store
                                    searchStores[0].removeAll();
                                    // Reload the stores that power the aggregated store
                                    for (var s=1; s < searchStores.length; s++)
                                    {
                                        // For each store that is powering the search, we emit a request
                                        if (!searchStores[s].isDestroyed)
                                        {
                                            searchStores[s].load({
                                                params:{
                                                    query:queryEvent.query,
                                                    role:gCurrentLoggedRole.value
                                                }
                                            });
                                        }
                                    }
                                    // The results will be merged in the aggregate store as per each store's 'load' listener
                                }
                            },
                            scope: this
                        }
                    })
                    ]
                }),
                new Ext.Panel({
                    region: "center",
                    style: "padding:31px 0px 0px; text-align: center;",
                    width: 80,
                    height: 67,
                    border: false,
                    padding: "7px",
                    bodyStyle: {
                        backgroundColor: JSONconf.bannerLineColor
                    },
                    html: '<img style="vertical-align: middle;"src="theme/app/img/panel/search_button.png"/>'
                }),
                {
                    columnWidth: 0.48,
                    html: "",
                    height: 100,
                    border: false
                },
                new Ext.Panel({
                    region: "east",
                    border: false,
                    width: 160,
                    height: 100,
                    bodyStyle: " background-color: transparent; ",
                    html: '<p style="text-align:right;padding: 15px;font-size:12px;"><a href="' + JSONconf.linkToCouncilWebsite + '" target="_blank">' + JSONconf.bannerRightCornerLine1 + '</a><br> ' + JSONconf.bannerRightCornerLine2 + ' <br><br>Map powered by <a href="http://www.pozi.com" target="_blank">Pozi</a></p>'

                })
            ]
        },
        {
            // HS MOD END
            region: "center",
            layout: "border",
            style: " background-color:white;padding:0px 10px 10px;",
            items: [
                westPanel,
                {
                    id: "centerpanel",
                    xtype: "panel",
                    layout: {
                        type: "vbox",
                        align: "stretch"
                    },
                    region: "center",
                    border: false,
                    items: [
                        {
                            height: 29,
                            border: false,
                            bodyStyle: {
                                backgroundColor: JSONconf.bannerLineColor,
                                margin: '0px 0px 0px',
                                padding: '5px 8px',
                                fontSize: '16px',
                                fontFamily: 'tahoma,arial,verdana,sans-serif',
                                color: '#FFFFFF',
                                fontWeight: 'bolder'
                            },
                            defaults: {
                                bodyStyle: {
                                    backgroundColor: JSONconf.bannerLineColor
                                },
                                border: false
                            },
                            layout: 'column',
                            items: [
                                function() {
                                    var mapContextsSize = function() {
                                        return (JSONconf.mapContexts.length === 0) ? 0 : JSONconf.mapContexts[0].size;
                                    };
                                    var mapContexts = function() {
                                        return (JSONconf.mapContexts.length === 0) ? "&nbsp;" : JSONconf.mapContexts[0].name;
                                    };
                                    // TODO: format the contexts into a drop down loading different layers if more than 1.
                                    return {
                                        html: '<div id="headerContainer">' + mapContexts() + '</div>',
                                        width: mapContextsSize()
                                    };
                                }(),
                                {
                                    html: "<img src='theme/app/img/panel/list-white-final.png' style='padding:2px;' alt='Layers' title='Layers' />",
                                    id: 'layerListButton',
                                    width: 20,
                                    hidden: JSONconf.hideLayerPanelButton,
                                    listeners: {
                                        render: function(c) {
                                            // Expanding the drop down on click
                                            c.el.on('click',
                                                function() {
                                                    if (westPanel.collapsed) {
                                                        westPanel.expand();
                                                    } else {
                                                        westPanel.collapse();
                                                    }
                                                }
                                            );
                                            // Using the pointer cursor when hovering over the element
                                            c.el.on('mouseover',
                                                function() {
                                                    this.dom.style.cursor = 'pointer';
                                                }
                                            );
                                        },
                                        scope: this
                                    }
                                },
                                {
                                    columnWidth: 1,
                                    html: "",
                                    height: 28
                                },
                                {
                                    id: "toolPlaceHolder",
                                    style: {
                                        // Haven't bee able to find a configuration to replicate:
                                        //  div align='right'
                                        display:'inline-block'
                                    },
                                    width: toolWidth
                                }
                            ]
                        },
                        {
                            xtype: "panel",
                            layout: 'card',
                            id: "panel",
                            border: false,
                            activeItem: 0,
                            flex: 1,
                            items: [
                                "mymap",
                                {
                                    xtype: 'gxp_googleearthpanel',
                                    mapPanel: "mymap"
                                }
                            ]
                        }
                    ]
                },
                eastPanel
            ]
        }
    ];

    // Masking the north region
    if (JSONconf.hideNorthRegion) {
        portalItems = [portalItems[1]];
    }

    return portalItems;

};

