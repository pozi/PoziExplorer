/** private: method[addLayers]
 *  :arg records: ``Array`` the layer records to add
 *  :arg source: :class:`gxp.plugins.LayerSource` The source to add from
 *  :arg isUpload: ``Boolean`` Do the layers to add come from an upload?
 */
// Reasons for override:
// - do not zoom to layer extent when it's added
// - more precise control of the group a layer is being added to
// - change the width of the table

gxp.plugins.AddLayers.prototype.initCapGrid = function() {
        var source, data = [], target = this.target;        
        for (var id in target.layerSources) {
            source = target.layerSources[id];
            if (source.store && source.ptype !== "gxp_cataloguesource") {
                data.push([id, source.title || id, source.url]);                
            }
        }
        var sources = new Ext.data.ArrayStore({
            fields: ["id", "title", "url"],
            data: data
        });

        var expander = this.createExpander();
        
        function addLayers() {
            var key = sourceComboBox.getValue();
            var source = this.target.layerSources[key];
            var records = capGridPanel.getSelectionModel().getSelections();
            this.addLayers(records, source);
        }
        
        var idx = 0;
        if (this.startSourceId !== null) {
            sources.each(function(record) {
                if (record.get("id") === this.startSourceId) {
                    idx = sources.indexOf(record);
                }
            }, this);
        }

        source = this.target.layerSources[data[idx][0]];

        var capGridPanel = new Ext.grid.GridPanel({
            store: source.store,
            autoScroll: true,
            flex: 1,
            autoExpandColumn: "title",
            plugins: [expander],
            loadMask: true,
            colModel: new Ext.grid.ColumnModel([
                expander,
                {id: "title", header: this.panelTitleText, dataIndex: "title", sortable: true},
                {header: "Id", dataIndex: "name", width: 250, sortable: true}
            ]),
            listeners: {
                rowdblclick: addLayers,
                scope: this
            }
        });
        
        var sourceComboBox = new Ext.form.ComboBox({
            ref: "../sourceComboBox",
            store: sources,
            valueField: "id",
            displayField: "title",
            tpl: '<tpl for="."><div ext:qtip="{url}" class="x-combo-list-item">{title}</div></tpl>',
            triggerAction: "all",
            editable: false,
            allowBlank: false,
            forceSelection: true,
            mode: "local",
            value: data[idx][0],
            listeners: {
                select: function(combo, record, index) {
                    var source = this.target.layerSources[record.get("id")];
                    capGridPanel.reconfigure(source.store, capGridPanel.getColumnModel());
                    // TODO: remove the following when this Ext issue is addressed
                    // http://www.extjs.com/forum/showthread.php?100345-GridPanel-reconfigure-should-refocus-view-to-correct-scroller-height&p=471843
                    capGridPanel.getView().focusRow(0);
                    this.setSelectedSource(source);
                },
                scope: this
            }
        });
        
        var capGridToolbar = null;
        if (this.target.proxy || data.length > 1) {
            capGridToolbar = [
                new Ext.Toolbar.TextItem({
                    text: this.layerSelectionText
                }),
                sourceComboBox
            ];
        }
        
        if (this.target.proxy) {
            capGridToolbar.push("-", new Ext.Button({
                text: this.addServerText,
                iconCls: "gxp-icon-addserver",
                handler: function() {
                    if (this.outputTarget) {
                        this.addOutput(newSourceDialog);
                    } else {
                        new Ext.Window({
                            title: gxp.NewSourceDialog.prototype.title,
                            modal: true,
                            hideBorders: true,
                            width: 300,
                            items: newSourceDialog
                        }).show();
                    }
                },
                scope: this
            }));
        }
        
        var newSourceDialog = {
            xtype: "gxp_newsourcedialog",
            header: false,
            listeners: {
                "hide": function(cmp) {
                    if (!this.outputTarget) {
                        cmp.ownerCt.hide();
                    }
                },
                "urlselected": function(newSourceDialog, url) {
                    newSourceDialog.setLoading();
                    this.target.addLayerSource({
                        config: {url: url}, // assumes default of gx_wmssource
                        callback: function(id) {
                            // add to combo and select
                            var record = new sources.recordType({
                                id: id,
                                title: this.target.layerSources[id].title || this.untitledText
                            });
                            sources.insert(0, [record]);
                            sourceComboBox.onSelect(record, 0);
                            newSourceDialog.hide();
                        },
                        fallback: function(source, msg) {
                            this.setError(
                                new Ext.Template(this.addLayerSourceErrorText).apply({msg: msg})
                            );
                        },
                        scope: this
                    });
                },
                scope: this
            }
        };
        
        var items = {
            xtype: "container",
            region: "center",
            layout: "vbox",
            items: [capGridPanel]
        };
        if (this.instructionsText) {
            items.items.push({
                xtype: "box",
                autoHeight: true,
                autoEl: {
                    tag: "p",
                    cls: "x-form-item",
                    style: "padding-left: 5px; padding-right: 5px"
                },
                html: this.instructionsText
            });
        }
        
        var bbarItems = [
            "->",
            new Ext.Button({
                text: this.addButtonText,
                iconCls: "gxp-icon-addlayers",
                handler: addLayers,
                scope : this
            }),
            new Ext.Button({
                text: this.doneText,
                handler: function() {
                    this.capGrid.hide();
                },
                scope: this
            })
        ];
        
        var uploadButton;
        if (!this.uploadSource) {
            uploadButton = this.createUploadButton();
            if (uploadButton) {
                bbarItems.unshift(uploadButton);
            }
        }

        var Cls = this.outputTarget ? Ext.Panel : Ext.Window;
        this.capGrid = new Cls(Ext.apply({
            title: this.availableLayersText,
            closeAction: "hide",
            layout: "border",
            height: 300,
            width: 550,
            modal: true,
            items: items,
            tbar: capGridToolbar,
            bbar: bbarItems,
            listeners: {
                hide: function(win) {
                    capGridPanel.getSelectionModel().clearSelections();
                },
                show: function(win) {
                    if (this.selectedSource === null) {
                        this.setSelectedSource(this.target.layerSources[data[idx][0]]);
                    } else {
                        this.setSelectedSource(this.selectedSource);
                    }
                },
                scope: this
            }
        }, this.initialConfig.outputConfig));
        if (Cls === Ext.Panel) {
            this.addOutput(this.capGrid);
        }
        
    };

gxp.plugins.AddLayers.prototype.addLayers = function(records, source, isUpload) {
    source = source || this.selectedSource;
    var layerStore = this.target.mapPanel.layers,
        extent, record, layer;
    for (var i=0, ii=records.length; i<ii; ++i) {
        record = source.createLayerRecord({
            name: records[i].get("name"),
            source: source.id
        });
        if (record) {
            layer = record.getLayer();
            if (layer.maxExtent) {
                if (!extent) {
                    extent = record.getLayer().maxExtent.clone();
                } else {
                    extent.extend(record.getLayer().maxExtent);
                }
            }
if (record.get("group") === "background") {

                layerStore.insert(0, [record]);
            } else {
    // TODO: Try triggering the layer/map refresh that happens when drag/dropping a layer
                layerStore.add([record]);
            }
        }
    }
    if (extent) {
      // TODO: we could trigger the zoomToExtent but only if we are outside the extent
        //this.target.mapPanel.map.zoomToExtent(extent);
    }
    if (records.length === 1 && record) {	
        // select the added layer
        this.target.selectLayer(record);
        if (isUpload && this.postUploadAction) {
            // show LayerProperties dialog if just one layer was uploaded
            var outputConfig,
                actionPlugin = this.postUploadAction;
            if (!Ext.isString(actionPlugin)) {
                outputConfig = actionPlugin.outputConfig;
                actionPlugin = actionPlugin.plugin;
            }
            this.target.tools[actionPlugin].addOutput(outputConfig);
        }
    }
};
