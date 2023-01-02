#!/bin/bash
set -e

yarn compile

docker build . -t travishaas/wel:latest --arch amd64

docker push travishaas/wel:latest
