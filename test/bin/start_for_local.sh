#!/bin/bash

exec 9< <(phantomjs --webdriver='127.0.0.1:8192')
grep -m 1 "Ghost Driver running on port" <&9
exec 9<&-

exec 9< <(./suite-sdk debug -l 9090 -g http://general.pozi.com/geoserver .)
grep -m 1 "Server on http://localhost:9090 started" <&9
exec 9<&-

export POZIEXPLORER_TEST_WEBDRIVER="http://localhost:8192/wd/hub"
export POZIEXPLORER_TEST_SUBJECT="http://localhost:9090/"

