/** private: method[createOutputConfig]
 *  :returns: ``Object`` Configuration object for an Ext.tree.TreePanel
 */

// Reasons for override:
// - configuration for expanded / collapsed initial display of layer groups (controlled by layer manager's group config)
// - handling of checkbox changes to select/deselect the node with the same click

gxp.plugins.LayerTree.prototype.createOutputConfig = function() {
    var treeRoot = new Ext.tree.TreeNode({
        text: this.rootNodeText,
        expanded: true,
        isTarget: false,
        allowDrop: false
    });
    
    var defaultGroup = this.defaultGroup,
        plugin = this,
        groupConfig,
        exclusive;
    for (var group in this.groups) {
        groupConfig = typeof this.groups[group] == "string" ?
            {title: this.groups[group]} : this.groups[group];
        exclusive = groupConfig.exclusive;
        treeRoot.appendChild(new GeoExt.tree.LayerContainer(Ext.apply({
            text: groupConfig.title,
            iconCls: "gxp-folder",
            // Extracting the expanded/collapsed state from groupConfig
            expanded: ("collapsed" in groupConfig?!groupConfig.collapsed:true),
            group: group == this.defaultGroup ? undefined : group,
            loader: new GeoExt.tree.LayerLoader({
                baseAttrs: exclusive ?
                    {checkedGroup: Ext.isString(exclusive) ? exclusive : group} :
                    undefined,
                store: this.target.mapPanel.layers,
                filter: (function(group) {
                    return function(record) {
                        return (record.get("group") || defaultGroup) == group &&
                            record.getLayer().displayInLayerSwitcher == true;
                    };
                })(group),
                createNode: function(attr) {
                    plugin.configureLayerNode(this, attr);
                    return GeoExt.tree.LayerLoader.prototype.createNode.apply(this, arguments);
                }
            }),
            singleClickExpand: true,
            allowDrag: false,
            listeners: {
                append: function(tree, node) {
                    node.expand();
                }
            }
        }, groupConfig)));
    }
    
    return {
        xtype: "treepanel",
        root: treeRoot,
        rootVisible: false,
        shortTitle: this.shortTitle,
        loader: new Ext.tree.TreeLoader({ preloadChildren: true }),
        border: false,
        enableDD: true,
        selModel: new Ext.tree.DefaultSelectionModel({
            listeners: {
                beforeselect: this.handleBeforeSelect,
                scope: this
            }
        }),
        listeners: {
            contextmenu: this.handleTreeContextMenu,
            beforemovenode: this.handleBeforeMoveNode,   
            checkchange:function(n,c){
              // Managing the change: actions associated with layer being switched on
              if (c)
              {
                // Finding the configuration of the layer from the node just changed
                for (k in JSONconf.layers)
                {
                    if (JSONconf.layers.hasOwnProperty(k)){
                        // Mostly layer name is in the title, but sometimes it's in the option array (args)
                        // Hack 1: we've had to add a title to the MapQuest layer for this piece of code to work on the MapQuest layer
                        // Hack 2: we've had to re-order the basemap layers so that Vicmap basemap is at the bottom
                        var layerTitleArgs = JSONconf.layers[k].args ? JSONconf.layers[k].args[0] : "";
                        // Cater for WMTS layers where the layer name is the "name" attribute
                        if (JSONconf.layers[k].args && JSONconf.layers[k].args[0].name)
                        {
                            layerTitleArgs = JSONconf.layers[k].args[0].name;
                        }
                        var layerTitle = JSONconf.layers[k].title ? JSONconf.layers[k].title : layerTitleArgs;
                        // Checking if there is configuration for ...
                        if (layerTitle && (layerTitle == n.layer.name))
                        {
                            // Layers to switch off ..
                            var layersToSwitchOff = JSONconf.layers[k].layersToTurnOffWhenShown;
                            for (ltc in layersToSwitchOff)
                            {
                                if (layersToSwitchOff.hasOwnProperty(ltc))
                                {
                                    app.mapPanel.map.getLayersByName(layersToSwitchOff[ltc])[0].setVisibility(false);
                                }
                            }
                            
                            // .. or layers to switch on                            
                            var layersToSwitchOn = JSONconf.layers[k].layersToTurnOnWhenShown;
                            for (ltc in layersToSwitchOn)
                            {
                                if (layersToSwitchOn.hasOwnProperty(ltc))
                                {
                                    app.mapPanel.map.getLayersByName(layersToSwitchOn[ltc])[0].setVisibility(true);
                                }
                            }

                            // Managing a change in the satellite imagery layer group
                            // Clicking on a layer within this group should set this layer to be the one the slider acts on
                            var layerGroup = JSONconf.layers[k].group;

                            // Setting the layer in the drop down
                            var osc = Ext.getCmp('opacitySliderCombo');

                            var valInOsc = _(osc.getStore().data.items).find(function(ddopt){
                                return ddopt.json.val = layerTitle;
                            })

                            // Synchronising the title with the drop down
                            if (valInOsc && layerTitle != "No Aerial" && layerTitle != "None")
                            {
                                osc.setValue(layerTitle);
                            }

                            if (layerGroup == "aerial")
                            {
                                // Getting the opacity slider component
                                var os = Ext.getCmp('geoExtOpacitySlider');
                                // Getting the previous slider value
                                var o = os.getValue();

                                if (layerTitle != "No Aerial")
                                {
                                    // Setting layer for slider
                                    os.setLayer(n.layer);
                                   
                                    // Setting value for slider
                                    if (o == os.minValue)
                                    {
                                        // Aplying max value if previous value was 0
                                        o = os.maxValue;
                                        // The following behaviour is useful when manually switching back to a layer that
                                        // has been slided to 0 previously. It set it to the maxValue but an artefact
                                        // makes the slider looks like it goes back to 100, then back to 0.
                                        // It is therefore a visual glitch (no impact on functionality) but we prefer to
                                        // avoid it altogether and no set opacity to maxValue.
                                        //os.setValue(o);
                                    }
                                    else
                                    {
                                        // Only applying previous visibility if it was non-null
                                        os.setValue(o);
                                    }
                                }
                                else
                                {
                                    os.setValue(os.minValue);
                                }
                            }
                        }                        
                    }
                }
              }

              // If the node checkbox is clicked then we select the node
              if (c)
              {
                n.select();
              }
              else 
              // We deselect any selected nodes
              {	
                  if (this.output[0])
                  {
                      this.output[0].getSelectionModel().clearSelections();
                  }
              }
            },
            scope: this
        },
        contextMenu: new Ext.menu.Menu({
            items: []
        })
    };
};
