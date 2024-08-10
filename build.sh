#!/bin/bash
set -e

yarn compile

docker buildx build . -t travishaas/wel:homeassistant --platform=linux/amd64

docker image push travishaas/wel:homeassistant
