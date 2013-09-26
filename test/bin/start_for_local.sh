#!/bin/bash

phantomjs --webdriver='127.0.0.1:8192' &> phantomjs.log &
while ! nc -vz localhost 8192; do sleep 1; done

./suite-sdk debug -l 9090 -g http://general.pozi.com/geoserver . &> poziexplorer.log &
while ! nc -vz localhost 9090; do sleep 1; done

export POZIEXPLORER_TEST_WEBDRIVER="http://localhost:8192/wd/hub"
export POZIEXPLORER_TEST_SUBJECT="http://localhost:9090/"

