// Adding the default tabs
addDefaultTabs = function(accordion, gLayoutsArr, JSONconf) {
    // Clearing the details from the panel
    accordion.removeAll();

    // Layout configuration the global variable array loaded at application start										
    var configArray = gLayoutsArr["NONE"];
    if (configArray) {
        // Here we should do the styling substitution to transform a config option into a proper style element
        for (c in configArray) {
            if (configArray.hasOwnProperty(c)) {
                if (! (configArray[c].headerCfg)) {
                    var t = configArray[c].title;
                    // headerCfg would not work if the title was part of the initial config
                    delete configArray[c].title;

                    var col = configArray[c].col;

                    if (! (col)) {
                        col = "#A0A0A0";
                    }

                    configArray[c].headerCfg = {
                        tag: 'div',
                        style: '	background-image: url();background-color: ' + col + ';padding-left: 10px;',
                        children: [
                            {
                                tag: 'div',
                                'html': t
                            }
                        ]
                    };
                }
            }
        }

        // And initialisation of the accordion items
        accordion.add(configArray);

    }

    // Refreshing the DOM with the newly added parts
    accordion.doLayout();

    // Expanding the first tab if configured to do so
    if (JSONconf.openFirstDefaultTab) {
        accordion.items.items[0].expand();
    }
};

