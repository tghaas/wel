#!/bin/bash
set -e

yarn compile

docker build . -t travishaas/wel:latest

docker push travishaas/wel:latest
