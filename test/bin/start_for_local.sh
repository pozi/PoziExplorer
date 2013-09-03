#!/bin/bash

exec 3< <(phantomjs --webdriver='127.0.0.1:8192')
grep -m 1 "running on port" <&3
exec 3<&-
while ! nc -vz localhost 8192; do sleep 1; done

exec 3< <(./suite-sdk debug -l 9090 -g http://general.pozi.com/geoserver .)
grep -m 1 "Server on http://localhost:9090 started" <&3
exec 3<&-
while ! nc -vz localhost 9090; do sleep 1; done

export POZIEXPLORER_TEST_WEBDRIVER="http://localhost:8192/wd/hub"
export POZIEXPLORER_TEST_SUBJECT="http://localhost:9090/"

