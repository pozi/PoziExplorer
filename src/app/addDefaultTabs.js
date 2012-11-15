// Adding the default tabs
addDefaultTabs = function(accordion, gLayoutsArr, JSONconf) {
    // Layout configuration the global variable array loaded at application start										
    var configArray = gLayoutsArr["NONE"];

    // Clearing the details from the panel
    accordion.removeAll();

    // Here we should do the styling substitution to transform a config option into a proper style element

    _(configArray).each(function(config) {

        if (!config.headerCfg) {
            
            delete config.title; // headerCfg would not work if the title was part of the initial config

            config.headerCfg = {
                tag: 'div',
                style: [
                    'background-image: none; ',
                    'background-color: ', (config.col || "#A0A0A0"), '; ',
                    'padding-left: 10px;'
                ].join(''),
                children: [
                    {
                        tag: 'div',
                        'html': config.title
                    }
                ]
            };
        }

    });

    // And initialisation of the accordion items
    if (configArray) { accordion.add(configArray); }

    // Refreshing the DOM with the newly added parts
    accordion.doLayout();

    // Expanding the first tab if configured to do so
    if (JSONconf.openFirstDefaultTab) {
        accordion.items.items[0].expand();
    }

};

