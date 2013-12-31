buildAllFeaturesDataStore = function(JSONconf) {
    // The aggregate store, powering the search drop down
    var agg_store = new Ext.data.JsonStore({
        autoLoad: false,
        // Memory proxy used because there is no "url" or data source (as the data gets pushed from the different)
        proxy: new Ext.data.MemoryProxy({}),
        idProperty: 'label',
        fields: [
            { name: "label", mapping: "data.label" },
            { name: "gsln",  mapping: "data.gsln" },
            { name: "idcol", mapping: "data.idcol" },
            { name: "idval", mapping: "data.idval" },
            { name: "ld",    mapping: "data.ld" },
            { name: "lgacol",mapping: "data.lgacol" },
            { name: "lga",   mapping: "data.lga" },
            { name: "store", mapping: "data.storeName" }
        ]
    });
    var arr_store = [agg_store];

    // Defining additional datastores
    var stor;
    for(s in JSONconf.searchEndPoints)
    {
        var propertyMapPrefix = JSONconf.searchEndPoints[s].propertyMapPrefix;
        var maxRecord = JSONconf.searchEndPoints[s].maxRecord;
        if (!maxRecord)
        {
            // If no max record configured, we allocate an equal number of records to each source
            maxRecord = Math.round(12 / helpers.objectSize(JSONconf.searchEndPoints));
        }

        stor = new Ext.data.JsonStore({
            autoLoad: false,
            //autoload the data
            root: JSONconf.searchEndPoints[s].root,
            baseParams: _({
                lga: JSONconf.LGACode,
                limit: maxRecord,
                storeName: s
            }).extend(JSONconf.extraSearchParameters),
            fields: [
                { name: "label", mapping: propertyMapPrefix+".label" },
                { name: "gsln",  mapping: propertyMapPrefix+".gsln" },
                { name: "idcol", mapping: propertyMapPrefix+".idcol" },
                { name: "idval", mapping: propertyMapPrefix+".idval" },
                { name: "ld",    mapping: propertyMapPrefix+".ld" },
                { name: "lgacol",mapping: propertyMapPrefix+".lgacol" },
                { name: "lga",   mapping: propertyMapPrefix+".lga" }
            ],
            proxy: new Ext.data.ScriptTagProxy({
                url: JSONconf.searchEndPoints[s].list
            }),
            listeners:{
                'load': function(store, records) {
                    // Selecting the first elements from records, according to the limit parameter
                    var keepRecords = records.slice(0,Math.min(records.length,store.baseParams.limit));
                    // Adding the storename to each record, so that we hit the right endpoint in the record select handler
                    for (var k=0; k < keepRecords.length; k++)
                    {
                        keepRecords[k].data.storeName = store.baseParams.storeName;
                    }
                    // We push the records even if there is no record (to end the loading indicator display)
                    agg_store.loadData(keepRecords,true);
                },
                'exception': function(misc) {
                    // Triggered when the JSON request to this endpoint timesout for instance
                    // Destroy this store so that this endpoint won't be queried again
                    // Useful to avoid repeating queries to endpoints that are just not available
                    this.destroy();
                }
            }
        });

        // Adding this store to the array
        arr_store.push(stor);
    }

    // Returning an array of stores
    return arr_store;
};
