# PoziExplorer

App based on the OpenGeo Suite SDK.

## Getting it running

First, install the Suite SDK.

Then to get the code:

    git clone https://github.com/groundtruth/PoziExplorer.git && cd PoziExplorer

To run in debug mode (for Groundtruth internal use):

    suite-sdk debug -l 9090 -g http://v3.pozi.com/geoserver .
    open http://localhost:9090/?config=corangamite    # for example

To deploy (GT internal use):

    suite-sdk deploy -d v3.pozi.com -r 8080 -u username -p password -c tomcat6x .
    open http://v3.pozi.com/corangamite    # for example

## Runtime dependencies

This project  PHP scripts running.
Please refer to `lib/custom/json` for more details.

