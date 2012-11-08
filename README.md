# PoziExplorer

App based on the [OpenGeo Suite SDK](http://opengeo.org/technology/sdk/).

## Getting it running

First, install the Suite SDK.

Then to get the code:

    git clone https://github.com/groundtruth/PoziExplorer.git && cd PoziExplorer

Set up customized `build.xml` (this will affect SDK commands for all apps):

    sudo cp /opt/opengeo/sdk/build.xml /opt/opengeo/sdk/build.xml.old
    sudo ln -s `pwd`/build.xml /opt/opengeo/sdk/build.xml

To run in debug mode (for Groundtruth internal use):

    suite-sdk debug -l 9090 -g http://v3.pozi.com/geoserver .
    open http://localhost:9090/?config=corangamite    # for example

To deploy (GT internal use):

    suite-sdk deploy -d v3.pozi.com -r 8080 -u username -p password -c tomcat6x .
    open http://v3.pozi.com/corangamite    # for example

## Runtime dependencies

This project expects to be able to use certain PHP scripts.
Please refer to `lib/custom/json` for more details.

## SDK version

This project began with SDK v2.5, but we're now using the v3.0 tooling.

