"""Build the C++17 dispatch CLI using the receiver's existing json-c dependency."""
from pathlib import Path
import shlex
import subprocess

root = Path(__file__).resolve().parents[1]
build = root / 'build'
build.mkdir(exist_ok=True)
flags = shlex.split(subprocess.check_output(['pkg-config', '--cflags', '--libs', 'json-c'], text=True))
subprocess.run(['g++', '-std=c++17', '-Wall', '-Wextra', '-pedantic',
                str(root / 'src/dispatch_cli.cpp'), *flags, '-o', str(build / 'dispatch')], check=True)
print(f'Built: {build / "dispatch"}')
