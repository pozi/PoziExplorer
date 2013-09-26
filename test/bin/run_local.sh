#!/bin/bash

source ./test/bin/start_for_local.sh

mocha
result=$?

source ./test/bin/stop.sh

echo "==================== phantomjs.log ===================="
cat phantomjs.log
echo "==================== poziexplorer.log ===================="
cat poziexplorer.log

exit $result

