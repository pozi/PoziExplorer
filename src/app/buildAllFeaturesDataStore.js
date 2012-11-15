buildAllFeaturesDataStore = function(JSONconf) {

    return new Ext.data.JsonStore({
        autoLoad: false,
        //autoload the data
        root: 'rows',
        baseParams: {
            config: JSONconf.databaseConfig,
            lga: JSONconf.LGACode
        },
        fields: [
            { name: "label", mapping: "row.label" },
            { name: "xmini", mapping: "row.xmini" },
            { name: "ymini", mapping: "row.ymini" },
            { name: "xmaxi", mapping: "row.xmaxi" },
            { name: "ymaxi", mapping: "row.ymaxi" },
            { name: "gsns",  mapping: "row.gsns" },
            { name: "gsln",  mapping: "row.gsln" },
            { name: "idcol", mapping: "row.idcol" },
            { name: "idval", mapping: "row.idval" },
            { name: "ld",    mapping: "row.ld" }
        ],
        proxy: new Ext.data.ScriptTagProxy({
            url: JSONconf.servicesHost + JSONconf.searchEndPoint
        })
    });

};
