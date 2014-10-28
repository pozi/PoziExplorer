// Helper functions

helpers = function() {

    var gotNum = function(str) {
        return /\d/.test(str);
    };

    return {
        // Source: http://stackoverflow.com/questions/13983666/javascript-to-parse-get-parameter-from-string-what-is-throwing-this-off
        getURLParameter: function(name, givenstring) {
            return decodeURI(
                (RegExp('(^|&)' + name + '=(.+?)(&|$)').exec(givenstring)||[,,null])[2]
            );
        },
        objectSize: function(obj) {
            var size = 0, key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) size++;
            }
            return size;
        },
        toTitleCase: function(str) {
            if (str)
            {
                if (typeof str !== 'string')
                {
                    str = str.toString();
                }

                var exceptLabs = {
                    "dtpli report":"DTPLI Report",
                    "pfi":"PFI",
                    "spi":"SPI",
                    "area (m2)":"Area (m<sup>2</sup>)",
                    "area (ha)":"Area (ha)",
                    "crefno":"CrefNo",
                    "council id":"Council ID",
                    "id":"ID"
                };

                if (exceptLabs[str.toLowerCase()])
                {
                    return exceptLabs[str.toLowerCase()];
                }
                else
                {
                    return str.replace(
                        /\w\S*/g,
                        function(txt) {
                            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                        }
                    );
                }
            }
            else
            {
                return "";
            }
        },

        toSmartTitleCase: function(str) {
            if (str)
            {
                if (typeof str !== 'string')
                {
                    str = str.toString();
                }
                return str.replace(
                    /\w\S*/g,
                    function(txt) {
                        if (gotNum(txt)) { return txt; }
                        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                    }
                );
            }
            else
            {
                return "";
            }
        },

        trim: function(str) {
            if (str) {
                if (typeof str !== 'string')
                {
                    str = str.toString();
                }
                return str.replace(/^\s*/, "").replace(/\s*$/, "");
            } else {
                return "";
            }
        },

        // source: http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
        isNumber: function(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

    };

}();

