#!/usr/bin/env bash
# Local dependency installation: requires Git, CMake, a C compiler and Make.
set -euo pipefail
deps="${COLDCHAIN_DEPS_DIR:-/workspace/deps}"
mkdir -p "$deps"
if [ ! -d "$deps/json-c-0.19-src" ]; then
  git clone --depth 1 --branch json-c-0.19-20260627 https://github.com/json-c/json-c.git "$deps/json-c-0.19-src"
fi
test "$(git -C "$deps/json-c-0.19-src" rev-parse HEAD)" = aa716cd8d663c976b99b0f30f102ee1d8ef63146
cmake -S "$deps/json-c-0.19-src" -B "$deps/json-c-0.19-build" \
  -DCMAKE_INSTALL_PREFIX="$deps/json-c-0.19" -DBUILD_SHARED_LIBS=OFF -DBUILD_TESTING=OFF
cmake --build "$deps/json-c-0.19-build" -j 4
cmake --install "$deps/json-c-0.19-build"
