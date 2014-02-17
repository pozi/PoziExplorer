// Adding the default tabs
addDefaultTabs = function(accordion, gLayoutsArr, JSONconf) {
    // Layout configuration the global variable array loaded at application start										
    var configArray = gLayoutsArr["NONE"];

    // Clearing the details from the panel
    accordion.removeAll();

    // Here we should do the styling substitution to transform a config option into a proper style element

    _(configArray).each(function(config) {

        if (!config.headerCfg) {
            
            // Saving the tab title in a temporary variable
            var tab_title = config.title;
            delete config.title; // headerCfg would not work if the title was part of the initial config

            // Browser specific style for correct presentation of tab title, icons and +/- sign on a single line
            var stylesArr = [
                'background-image: none; ',
                'background-color: ', (config.col || "#7a7a7a"), '; ',
                'padding-left: 10px;'
            ];
            if (Ext.isIE6 || Ext.isIE7)
            {
                stylesArr.push('display: inline-block;');
            }

            config.headerCfg = {
                tag: 'div',
                style: stylesArr.join(''),
                children: [
                    {
                        tag: 'div',
                        'html': tab_title
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
        if (accordion.items.length)
        {
            accordion.items.items[0].expand();
        }
    }

};

