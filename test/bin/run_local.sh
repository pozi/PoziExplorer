#!/bin/bash

# source ./test/bin/start_for_local.sh


# exec 3< <(phantomjs --webdriver='127.0.0.1:8192')
# grep -m 1 "Ghost Driver running on port" <&3
# exec 3<&-

# exec 3< <(./suite-sdk debug -l 9090 -g http://general.pozi.com/geoserver .)
# grep -m 1 "Server on http://localhost:9090 started" <&3
# exec 3<&-

phantomjs --webdriver='127.0.0.1:8192' &
./suite-sdk debug -l 9090 -g http://general.pozi.com/geoserver . &

sleep 10

export POZIEXPLORER_TEST_WEBDRIVER="http://localhost:8192/wd/hub"
export POZIEXPLORER_TEST_SUBJECT="http://localhost:9090/"


mocha
result=$?

source ./test/bin/stop.sh

exit $result

