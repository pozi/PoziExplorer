# PoziExplorer

App based on the [OpenGeo Suite SDK](http://opengeo.org/technology/sdk/).

## Getting it running

Get the code:

    git clone https://github.com/groundtruth/PoziExplorer.git && cd PoziExplorer
    git submodule init
    git submodule update

To run in debug mode (for Groundtruth internal use):

    ./suite-sdk debug -l 9090 -g http://v3.pozi.com/geoserver .
    open http://localhost:9090/?config=cardinia   # for example
    open http://cardinia.pozi.dev:9090/           # for example (only if you've set the right alias for localhost)

To deploy (for Groundtruth use):

    ./suite-sdk deploy -d v3.pozi.com -r 8080 -u manager -p password -c tomcat6x .
    open http://corangamite.pozi.com   # for example
    open http://corangamite.pozi.com/rev.txt   # for revision details of live code

## About the SDK dependency

Don't install the OpenGeo SDK on your system. It is bundled into PoziExplorer
as a git submodule.

Be sure to run all `suite-sdk` commands using the project-specific version of
the script (`./suite-sdk`). This will use the bundled version of the SDK
(under `opengeo-suite-sdk/`) and the project specific `build.xml` file.

## Other runtime dependencies

This project expects to be able to use certain PHP scripts.
Please refer to `lib/custom/json/` for more details.

