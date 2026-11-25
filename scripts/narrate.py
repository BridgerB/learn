"""
Records data/script.json with Kokoro: one WAV per line plus each line's length.

  pnpm narrate                    # = this script on data/script.json → data/
  pnpm narrate 2 5                # re-record only lines 2 and 5

script.json: {"title": "...", "voice": "af_heart", "speed": 1.15, "lang": "en-us",
              "lines": ["scene 0 narration", "scene 1 narration", ...]}
Writes data/line<N>.wav and data/durs.json (spoken length of each line, seconds).
Needs `pnpm setup:voice` once (model, voices and kokoro-onnx in ~/.cache/learn).
"""
import json, os, sys, wave
import numpy as np
from kokoro_onnx import Kokoro

home = os.environ.get("LEARN_HOME", os.path.expanduser("~/.cache/learn"))
data = "data"
cfg = json.load(open(os.path.join(data, "script.json")))
lines = cfg["lines"]
only = {int(a) for a in sys.argv[1:]}

k = Kokoro(os.path.join(home, "voice/kokoro-v1.0.onnx"), os.path.join(home, "voice/voices-v1.0.bin"))
durs_path = os.path.join(data, "durs.json")
old = json.load(open(durs_path)) if os.path.exists(durs_path) else []
durs = [old[i] if i < len(old) else 0.0 for i in range(len(lines))]

for i, line in enumerate(lines):
    if only and i not in only:
        continue
    s, sr = k.create(line, voice=cfg.get("voice", "af_heart"), speed=cfg.get("speed", 1.15), lang=cfg.get("lang", "en-us"))
    with wave.open(os.path.join(data, f"line{i}.wav"), "wb") as w:  # plain 16-bit mono WAV
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(s, -1, 1) * 32767).astype(np.int16).tobytes())
    durs[i] = len(s) / sr
    print(f"line {i}: {durs[i]:.1f}s")

# Remove recordings of lines that no longer exist.
n = len(lines)
while os.path.exists(os.path.join(data, f"line{n}.wav")):
    os.remove(os.path.join(data, f"line{n}.wav"))
    n += 1
json.dump(durs, open(durs_path, "w"))
print(f"total {sum(durs):.1f}s over {len(lines)} lines")
