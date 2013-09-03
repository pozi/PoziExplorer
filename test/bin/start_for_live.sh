#!/bin/bash

exec 3< <(phantomjs --webdriver='127.0.0.1:8192')
grep -m 1 "Ghost Driver running on port" <&3
exec 3<&-
while ! nc -vz localhost 8192; do sleep 1; done

export POZIEXPLORER_TEST_WEBDRIVER="http://localhost:8192/wd/hub"
export POZIEXPLORER_TEST_SUBJECT="http://cardinia.pozi.com/"

