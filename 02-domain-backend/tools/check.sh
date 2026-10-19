#!/usr/bin/env bash
set -euo pipefail
backend_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$backend_root/.."
if [ -f "$backend_root/build/env.sh" ]; then
  source "$backend_root/build/env.sh"
fi
python3 02-domain-backend/tools/build_backend.py
python3 04-esp32-sensor/tools/build_receiver.py
python3 -m unittest discover -s 02-domain-backend/tests -v
python3 -m unittest discover -s 04-esp32-sensor/tests -v
