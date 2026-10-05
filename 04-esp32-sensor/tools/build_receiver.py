"""Build the host receiver and generate its per-file IntelliSense configuration."""

import json
from pathlib import Path
import shlex
import shutil
import subprocess

tools = Path(__file__).resolve().parent
compiler = shutil.which("g++")
if compiler is None:
    raise SystemExit("g++ is required to build the host receiver")
flags = shlex.split(subprocess.check_output(
    ["pkg-config", "--cflags", "--libs", "json-c"], text=True
))
source = tools / "serial_readings.cpp"
build = tools / "build"
build.mkdir(exist_ok=True)
command = [compiler, "-std=c++17", "-Wall", "-Wextra", "-pedantic",
           str(source), *flags, "-o", str(build / "serial_readings")]
subprocess.run(command, check=True)
(build / "compile_commands.json").write_text(json.dumps([{
    "directory": str(tools), "file": str(source), "arguments": command,
}], indent=2) + "\n")
print(f"Built: {build / 'serial_readings'}")

# PlatformIO regenerates this file. Reapply the host entry after rebuilding
# its IntelliSense index; preserve all existing firmware settings.
properties = tools.parent / ".vscode" / "c_cpp_properties.json"
if properties.exists():
    content = properties.read_text()
    config = json.loads("\n".join(
        line for line in content.splitlines() if not line.lstrip().startswith("//")
    ))
    for entry in config.get("configurations", []):
        entry["compileCommands"] = str(build / "compile_commands.json")
    properties.write_text(json.dumps(config, indent=4) + "\n")
    print("Updated per-file IntelliSense configuration")
