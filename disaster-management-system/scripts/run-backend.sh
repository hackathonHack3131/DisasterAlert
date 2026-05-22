#!/bin/bash
set -a
cd "$(dirname "$0")/../backend"
[ -f .env ] && source .env
set +a
mvn spring-boot:run
