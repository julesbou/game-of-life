#!/bin/bash

threshold="75%"

# Convert image to zero-one map, usage:
#
# ./convert.sh spaceship.png 9x7
# 000000000
# 000110000
# 001111000
# 001101100
# 000011000
# 000000000
# 000000000
convert -resize $2 -threshold ${3:-$threshold} $1 pbm: | pnmnoraw | tail -n+3
