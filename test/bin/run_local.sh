#!/bin/bash

source ./test/bin/start_for_local.sh

mocha
result=$?

source ./test/bin/stop.sh

exit $result

