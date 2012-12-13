# PoziExplorer

App based on the [OpenGeo Suite SDK](http://opengeo.org/technology/sdk/).

## SDK version

This project began with SDK v2.5, but we're now using the v3.0 tooling.

## Getting it running

First, [install the Suite SDK](http://suite.opengeo.org/opengeo-docs/apps/clientsdk.html#sdk-installation).

Then get the PoziExplorer code:

    git clone https://github.com/groundtruth/PoziExplorer.git && cd PoziExplorer

Set up customized `build.xml` (this will affect SDK commands for all apps):

    sudo mv /opt/opengeo/sdk/build.xml /opt/opengeo/sdk/build.xml.old
    sudo ln -s `pwd`/build.xml /opt/opengeo/sdk/build.xml

To run in debug mode (for Groundtruth internal use):

    suite-sdk debug -l 9090 -g http://v3.pozi.com/geoserver .
    open http://localhost:9090/?config=corangamite  # for example
    open http://corangamite.pozi.dev:9090/          # for example (only if you've set the right alias for localhost)

To deploy (for Groundtruth use):

    suite-sdk deploy -d v3.pozi.com -r 8080 -u username -p password -c tomcat6x .
    open http://corangamite.pozi.com   # for example
    open http://corangamite.pozi.com/rev.txt   # for revision details of live code

## Other runtime dependencies

This project expects to be able to use certain PHP scripts.
Please refer to `lib/custom/json/` for more details.

