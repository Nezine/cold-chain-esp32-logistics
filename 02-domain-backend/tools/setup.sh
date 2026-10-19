#!/usr/bin/env bash
# Run from any directory. Generated dependencies remain under ignored build/.
set -euo pipefail
backend_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
for tool in python3 git g++ pkg-config make; do
  command -v "$tool" >/dev/null || { echo "Missing required tool: $tool" >&2; exit 1; }
done
mkdir -p "$backend_root/build"
python3 -m venv "$backend_root/build/venv"
export PATH="$backend_root/build/venv/bin:$PATH"
export PIP_CACHE_DIR="$backend_root/build/pip-cache"
python -m pip install --disable-pip-version-check cmake==3.31.6 platformio==6.1.19
export COLDCHAIN_DEPS_DIR="$backend_root/build/deps"
bash "$backend_root/tools/setup_json_c.sh"
export PKG_CONFIG_PATH="$COLDCHAIN_DEPS_DIR/json-c-0.19/lib/pkgconfig${PKG_CONFIG_PATH:+:$PKG_CONFIG_PATH}"
python "$backend_root/tools/build_backend.py"
python "$backend_root/../04-esp32-sensor/tools/build_receiver.py"
python - "$backend_root" <<'PY'
from pathlib import Path
import shlex
import sys
root = Path(sys.argv[1])
(root/'build/env.sh').write_text(
    'export PATH='+shlex.quote(str(root/'build/venv/bin'))+':"$PATH"\n'
    'export PKG_CONFIG_PATH='+shlex.quote(str(root/'build/deps/json-c-0.19/lib/pkgconfig'))+'\n'
    'export PLATFORMIO_CORE_DIR='+shlex.quote(str(root/'build/platformio'))+'\n')
PY
printf 'Setup complete. Activate tools: source "%s/build/env.sh"\n' "$backend_root"
