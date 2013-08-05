buildAllFeaturesDataStore = function(JSONconf) {

    return new Ext.data.JsonStore({
        autoLoad: false,
        //autoload the data
        root: 'features',
        baseParams: {
            lga: JSONconf.LGACode
        },
        fields: [
            { name: "label", mapping: "properties.label" },
            { name: "gsln",  mapping: "properties.gsln" },
            { name: "idcol", mapping: "properties.idcol" },
            { name: "idval", mapping: "properties.idval" },
            { name: "ld",    mapping: "properties.ld" }
        ],
        proxy: new Ext.data.ScriptTagProxy({
            url: JSONconf.searchEndPoints.basemap.list
        })
    });

};
