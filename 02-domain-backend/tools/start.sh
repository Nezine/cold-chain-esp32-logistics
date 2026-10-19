#!/usr/bin/env bash
set -euo pipefail
backend_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f "$backend_root/build/env.sh" ]; then
  source "$backend_root/build/env.sh"
fi
mkdir -p "$backend_root/build/data"
# Pass --state to use a different file; development data is never committed.
exec python3 "$backend_root/tools/dev_api.py" --state "$backend_root/build/data/state.json" "$@"
