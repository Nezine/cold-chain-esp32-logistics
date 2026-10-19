"""Build both C++ entry points. All business rules remain in C++."""
from pathlib import Path
import os
import shlex
import subprocess

root = Path(__file__).resolve().parents[1]
build = root / 'build'
build.mkdir(exist_ok=True)
flags = shlex.split(subprocess.check_output(['pkg-config', '--cflags', '--libs', 'json-c'], text=True))
compiler = os.environ.get('CXX', 'g++')
for source, target in [('backend_cli.cpp', 'backend'), ('dispatch_cli.cpp', 'dispatch')]:
    subprocess.run([compiler, '-std=c++17', '-Wall', '-Wextra', '-pedantic',
                    str(root / 'src' / source), *flags, '-o', str(build / target)], check=True)
    print(f'Built: {build / target}')
