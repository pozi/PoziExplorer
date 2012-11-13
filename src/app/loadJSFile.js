// Function that is able to dynamically load extra Javascript
loadJSFile = function(filename, cbk) {
    var fileref = document.createElement('script');
    fileref.setAttribute("type", 'text/javascript');

    // The onload callback option does not work as expected in IE so we are using the following work-around
    // From: http://www.nczonline.net/blog/2009/07/28/the-best-way-to-load-external-javascript/
    if (fileref.readyState) {
        //IE
        fileref.onreadystatechange = function() {
            if (fileref.readyState == "loaded" || fileref.readyState == "complete") {
                fileref.onreadystatechange = null;
                cbk();
            }
        };
    } else {
        //Others
        fileref.onload = function() {
            cbk();
        };
    }
    fileref.setAttribute("src", filename);
    document.getElementsByTagName('head')[0].appendChild(fileref);
};

