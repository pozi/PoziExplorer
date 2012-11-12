// Helper functions
function toTitleCase(str)
 {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function gotNum(str) {
    return /\d/.test(str);
}

function toSmartTitleCase(str)
 {
    return str.replace(/\w\S*/g,
    function(txt) {
        if (gotNum(txt))
        {
            return txt;
        }
        else
        {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    });
}

function trim(str)
 {
    if (str)
    {
        return str.replace(/^\s*/, "").replace(/\s*$/, "");
    }
    else
    {
        return "";
    }
}

