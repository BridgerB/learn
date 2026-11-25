#!/usr/bin/env bash
# One-time setup for `pnpm narrate`: a Python venv with kokoro-onnx, plus Kokoro's
# model and voices, in ~/.cache/learn (override with LEARN_HOME). Every clone of
# this repo shares it, so it only downloads once (about 340 MB).
set -euo pipefail
home="${LEARN_HOME:-$HOME/.cache/learn}"
base="https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"

command -v ffmpeg >/dev/null || { echo "ffmpeg is required (macOS: brew install ffmpeg)" >&2; exit 1; }

# kokoro-onnx 0.6 needs Python 3.10-3.13; plain python3 is often older (macOS ships 3.9).
python=""
for p in python3.13 python3.12 python3.11 python3.10 python3; do
	if command -v "$p" >/dev/null && "$p" -c 'import sys; sys.exit(not ((3, 10) <= sys.version_info[:2] <= (3, 13)))'; then
		python="$p"
		break
	fi
done
[ -n "$python" ] || { echo "Python 3.10-3.13 is required (macOS: brew install python@3.13)" >&2; exit 1; }

mkdir -p "$home/voice"
if [ ! -x "$home/venv/bin/python" ]; then
	echo "creating $home/venv with $python"
	"$python" -m venv "$home/venv"
fi
"$home/venv/bin/pip" install --quiet --disable-pip-version-check "kokoro-onnx==0.6.1"

for f in kokoro-v1.0.onnx voices-v1.0.bin; do
	if [ ! -s "$home/voice/$f" ]; then
		echo "downloading $f"
		curl -fL --progress-bar -o "$home/voice/$f.part" "$base/$f"
		mv "$home/voice/$f.part" "$home/voice/$f"
	fi
done
echo "voice ready in $home"
