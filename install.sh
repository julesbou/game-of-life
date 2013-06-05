#!/bin/bash

echo '.. npm install'
npm install

echo '.. compiling less'
lessc style.less > style.css

echo '.. autoprefixing css'
./node_modules/autoprefixer/bin/autoprefixer style.css

echo 'Done'
