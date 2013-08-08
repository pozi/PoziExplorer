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
            { name: "ld",    mapping: "data.ld" }
        ]
    });
    var arr_store = [agg_store];

    // Defining additional datastores
    var stor;
    for(s in JSONconf.searchEndPoints)
    {
        var propertyMapPrefix = JSONconf.searchEndPoints[s].propertyMapPrefix;
        stor = new Ext.data.JsonStore({
            autoLoad: false,
            //autoload the data
            root: JSONconf.searchEndPoints[s].root,
            baseParams: {
                lga: JSONconf.LGACode,
                limit: 12
            },
            fields: [
                { name: "label", mapping: propertyMapPrefix+".label" },
                { name: "gsln",  mapping: propertyMapPrefix+".gsln" },
                { name: "idcol", mapping: propertyMapPrefix+".idcol" },
                { name: "idval", mapping: propertyMapPrefix+".idval" },
                { name: "ld",    mapping: propertyMapPrefix+".ld" }
            ],
            proxy: new Ext.data.ScriptTagProxy({
                url: JSONconf.searchEndPoints[s].list
            }),
            listeners:{
                'load': function(store, records) {
                    if (agg_store.getCount() + records.length > 12)
                    {
                        // Case 1: we're inserting records that are going to overflow the 10 possible spots in the drop down list
                        // At a first approximation, we delete records in the store to allow 5 records to come in (case of 2 search endpoints)
                        var agg_recs;
                        if (records.length > 6)
                        {
                            if (agg_store.getCount() > 6)
                            {
                                records = records.slice(0,6);
                                agg_recs = agg_store.getRange(0,5);
                            }
                            else
                            {
                                records = records.slice(0,12-agg_store.getCount());
                                agg_recs = agg_store.getRange();
                            }
                        }
                        else
                        {
                            agg_recs = agg_store.getRange(0,11-records.length);
                        }
                        agg_store.loadData(agg_recs.concat(records));
                    }
                    else
                    {
                        // Case 2: otherwise, we just push the records in the aggregate store
                        // We push them even if there is no record to end the loading indicator display
                        agg_store.loadData(records,true);
                    }
                },
                'exception': function(misc) {
                    // Triggered when the JSON request to this endpoint timesout for instance
                    // We would like to do something here, possibly destroy this store
                    // For the moment, the request is just aborted, but each search will try to query
                    // this unavailable endpoint anyway ...
                    // Have tried to implement a 'ping' mechanism but got quite complicated with the
                    // asynchronous nature of multiple pings and the fact that this function returns
                    // an array to the calling code (buildPortalItems)
                }
            }
        });

        // Adding this store to the array
        arr_store.push(stor);
    }

    // Returning an array of stores
    return arr_store;
};
