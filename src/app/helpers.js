// Helper functions

helpers = function() {

    var gotNum = function(str) {
        return /\d/.test(str);
    };



    return {
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
                return str.replace(
                    /\w\S*/g,
                    function(txt) {
                        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                    }
                );
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
        }

    };

}();

