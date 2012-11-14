// Helper functions

helpers = function() {

    var gotNum = function(str) {
        return /\d/.test(str);
    };

    return {

        toTitleCase: function(str) {
            return str.replace(
                /\w\S*/g,
                function(txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                }
            );
        },

        toSmartTitleCase: function(str) {
            return str.replace(
                /\w\S*/g,
                function(txt) {
                    if (gotNum(txt)) { return txt; }
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                }
            );
        },

        trim: function(str) {
            if (str) {
                return str.replace(/^\s*/, "").replace(/\s*$/, "");
            } else {
                return "";
            }
        }

    };

}();

