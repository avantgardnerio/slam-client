#!/bin/bash
cd "$( cd "$( dirname "$0" )" && pwd )"
coffee -cb alea.coffee
java -jar compiler.jar --js alea.js --js_output_file alea.min.js
rm alea.js
mv alea.min.js alea.js
echo "/* Alea version 1.0.0 */"|cat - alea.js > /tmp/out && mv /tmp/out alea.js
