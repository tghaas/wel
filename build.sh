#!/bin/bash
docker build . -t travishaas/wel:latest

docker push travishaas/wel:latest