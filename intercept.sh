#!/bin/sh
telepresence connect -n huna
telepresence intercept huna-huna-notifications --port 3003:http --to-pod 8181 --replace --env-file ./.env || true
