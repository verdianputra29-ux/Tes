"""Synthesize music + SFX from an episode timeline.json -> stereo WAV.
Usage: python3 sfx.py timeline.json out.wav
"""
import json, sys, wave
import numpy as np

SR = 44100
tl = json.load(open(sys.argv[1]))
DUR = tl["dur"]
N = int(SR * DUR)
music = np.zeros(N)
fx = np.zeros(N)
rng = np.random.default_rng(7)


def add(buf, sig, t, gain=1.0):
    i = int(t * SR)
    j = min(N, i + len(sig))
    if 0 <= i < N:
        buf[i:j] += sig[: j - i] * gain


def env(n, a=0.005, r=None):
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    if r:
        e *= np.exp(-np.arange(n) / (r * SR))
    return e


def ts(d):
    return np.arange(int(d * SR)) / SR


def noise(d):
    return rng.uniform(-1, 1, int(d * SR))


def onepole(x, a):
    """one-pole lowpass; a may be scalar or per-sample array"""
    a = np.broadcast_to(a, x.shape)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def sweep(f, d):
    """sine with per-sample frequency array f"""
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


_pl = {}


def pluck(freq, d=0.8):
    key = (round(freq, 2), d)
    if key not in _pl:
        n = int(d * SR)
        p = max(2, int(SR / freq))
        buf = rng.uniform(-1, 1, p)
        out = np.empty(n)
        for k in range(n):
            out[k] = buf[k % p]
            buf[k % p] = 0.5 * (buf[k % p] + buf[(k + 1) % p]) * 0.996
        _pl[key] = out * env(n, 0.002)
    return _pl[key]


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


# ---------------- music (same ukulele loop as Eps. 1) ----------------
BPM = 112
beat = 60 / BPM
chords = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]]
melody = [76, 79, 81, 79, 76, 74, 72, 74, 72, 69, 72, 74, 76, 74, 71, 67]


def music_section(t0, t1, gain):
    b = 0
    while t0 + b * beat < t1:
        t = t0 + b * beat
        ch = chords[(b // 4) % 4]
        for k, m in enumerate(ch):
            add(music, pluck(midi(m)), t + k * 0.012, 0.16 * gain * (1 if b % 2 == 0 else 0.7))
        for k, m in enumerate(ch[1:]):
            add(music, pluck(midi(m), 0.4), t + beat / 2 + k * 0.01, 0.08 * gain)
        d = beat * 0.9
        add(music, np.sin(2 * np.pi * midi(ch[0] - 24) * ts(d)) * env(int(d * SR), 0.01, 0.25), t, 0.32 * gain)
        if (b // 4) % 2 == 1:
            add(music, pluck(midi(melody[(b * 2) % 16]), 0.5), t, 0.12 * gain)
            add(music, pluck(midi(melody[(b * 2 + 1) % 16]), 0.5), t + beat / 2, 0.10 * gain)
        for h in (0, 0.5):
            n = noise(0.05)
            add(music, (n - onepole(n, 0.6)) * env(len(n), 0.002, 0.012), t + h * beat, 0.06 * gain)
        b += 1


# render sections one at a time so later sections aren't zeroed by an earlier cut
for t0, t1, g in sorted(tl["music"]):
    tmp_before = music.copy()
    music[:] = 0
    music_section(t0, t1, g)
    i1 = int(t1 * SR)
    if i1 < N:  # short fade, then silence (abrupt "music stops" gag)
        f = min(N - i1, int(0.04 * SR))
        music[i1:i1 + f] *= np.linspace(1, 0, f)
        music[i1 + f:] = 0
    music += tmp_before


# ---------------- sfx library ----------------
def s_pop(t, f=600, g=0.5):
    x = ts(0.09)
    add(fx, np.sin(2 * np.pi * (f + 900 * np.exp(-x * 60)) * x) * env(len(x), 0.001, 0.025), t, g)


def s_whoosh(t, d=0.45, g=0.5, up=True):
    n = noise(d)
    k = np.linspace(0, 1, len(n))
    a = (0.05 + 0.5 * k) if up else (0.55 - 0.5 * k)
    add(fx, onepole(n, a) * np.sin(np.pi * k) ** 1.5 * 2.2, t, g)


def s_boing(t, g=0.5):
    x = ts(0.6)
    add(fx, sweep(180 + 430 * x + 40 * np.sin(2 * np.pi * 18 * x), 0.6) * env(len(x), 0.003, 0.25), t, g)


def s_click(t, g=0.4):
    n = noise(0.02)
    add(fx, n * env(len(n), 0.0005, 0.004), t, g)
    s_pop(t + 0.01, 300, g * 0.6)


def s_cricket(t, g=0.18):
    for k in range(3):
        x = ts(0.05)
        add(fx, np.sin(2 * np.pi * 4400 * x) * (np.sin(2 * np.pi * 60 * x) > 0) * env(len(x), 0.002, 0.03), t + k * 0.09, g)


def s_slurp(t, g=0.35):
    d = 0.45
    n = noise(d)
    k = np.linspace(0, 1, len(n))
    add(fx, onepole(n, 0.02 + 0.25 * k) * np.sin(np.pi * k) * (1 + 0.6 * np.sin(2 * np.pi * 25 * ts(d))) * 3, t, g)


def s_notif(t, f=1.0, g=0.35):
    for k, fr in enumerate([1318.5 * f, 1760 * f]):
        x = ts(0.25)
        add(fx, (np.sin(2 * np.pi * fr * x) + 0.3 * np.sin(4 * np.pi * fr * x)) * env(len(x), 0.002, 0.08), t + k * 0.09, g)


def s_cash(t, g=0.35):
    for k, fr in enumerate([2093, 2637, 3136]):
        x = ts(0.5)
        add(fx, np.sin(2 * np.pi * fr * x) * env(len(x), 0.001, 0.12), t + k * 0.05, g)
    n = noise(0.08)
    add(fx, (n - onepole(n, 0.5)) * env(len(n), 0.001, 0.02), t, g * 0.8)


def s_tada(t, g=0.3):
    for k, m in enumerate([72, 76, 79, 84]):
        add(fx, pluck(midi(m), 1.2), t + k * 0.07, g)


def s_sad(t, g=0.4):
    """descending 'wah wah wah waaah'"""
    for k, (m, d) in enumerate([(55, 0.35), (54, 0.35), (53, 0.35), (52, 1.0)]):
        x = ts(d)
        fr = midi(m) * (1 + 0.012 * np.sin(2 * np.pi * 6 * x) * (d > 0.5))
        w = sweep(fr, d)
        tone = np.sign(w) * 0.3 + w * 0.7
        add(fx, onepole(tone, 0.15) * env(len(x), 0.02) * np.linspace(1, 0.2 if d > .5 else .7, len(x)) * 1.6, t + k * 0.38, g)


def s_crunch(t, g=0.35):
    for k in range(4):
        n = noise(0.03)
        add(fx, (n - onepole(n, 0.3)) * env(len(n), 0.0005, 0.008), t + k * 0.035 + rng.uniform(0, 0.01), g)


def s_sting(t, g=0.45):
    for k, (ms, d) in enumerate([([48, 51, 54], 0.25), ([47, 50, 53], 0.25), ([46, 49, 52, 58], 1.2)]):
        for m in ms:
            add(fx, pluck(midi(m), d + 0.3), t + k * 0.28, g * 0.5)
        x = ts(d + 0.3)
        add(fx, np.sin(2 * np.pi * midi(ms[0] - 12) * x) * env(len(x), 0.005, 0.4), t + k * 0.28, g * 0.6)


def s_heart(t, g=0.5):
    for k in (0, 0.16):
        x = ts(0.12)
        add(fx, np.sin(2 * np.pi * (60 + 40 * np.exp(-x * 40)) * x) * env(len(x), 0.002, 0.04), t + k, g)


def s_glitch(t, d=3.0, g=0.18):
    x = ts(d)
    sq = np.sign(np.sin(2 * np.pi * (220 + 600 * (rng.random(len(x) // 2205 + 1).repeat(2205)[: len(x)])) * x))
    gate = (rng.random(len(x) // 1470 + 1) > 0.45).repeat(1470)[: len(x)]
    add(fx, sq * gate * 0.6, t, g)


def s_slam(t, g=0.6):
    x = ts(0.25)
    add(fx, np.sin(2 * np.pi * (90 + 120 * np.exp(-x * 30)) * x) * env(len(x), 0.001, 0.07), t, g)
    n = noise(0.06)
    add(fx, onepole(n, 0.3) * env(len(n), 0.001, 0.02) * 2, t, g * 0.6)


def s_ding(t, f=1318.5, g=0.35):
    x = ts(1.4)
    add(fx, (np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * f * 2.76 * x)) * env(len(x), 0.002, 0.4), t, g)


def s_growl(t, g=0.45):
    d = 1.1
    x = ts(d)
    n = onepole(noise(d), 0.03)
    am = 0.5 + 0.5 * np.sin(2 * np.pi * (8 + 6 * x) * x)
    tone = sweep(90 + 30 * np.sin(2 * np.pi * 2 * x), d) * 0.5
    add(fx, (n * 4 + tone) * am * np.sin(np.pi * x / d), t, g)


def s_tick(t, n=10, g=0.15):
    for k in range(int(n)):
        s_click(t + k * 0.25, g)


def s_choir(t, g=0.22):
    d = 2.6
    x = ts(d)
    sig = np.zeros(len(x))
    for m in [60, 64, 67, 72, 76]:
        fr = midi(m) * (1 + 0.004 * np.sin(2 * np.pi * 5 * x + m))
        w = sweep(fr, d)
        sig += w + 0.3 * np.sin(2 * np.arcsin(np.clip(w, -1, 1)))
    a = np.minimum(1, x / 0.4) * np.minimum(1, (d - x) / 0.8)
    add(fx, sig / 5 * a, t, g)


def s_sparkle(t, g=0.18):
    for k in range(6):
        x = ts(0.3)
        add(fx, np.sin(2 * np.pi * (2600 + 400 * k) * x) * env(len(x), 0.001, 0.07), t + k * 0.06, g)


def s_nom(t, g=0.35):
    x = ts(0.1)
    add(fx, np.sin(2 * np.pi * (250 + 150 * np.sin(np.pi * x / 0.1)) * x) * env(len(x), 0.003, 0.04), t, g)


def s_steps(t, t1=3.0, every=0.15, g=0.3):
    k = t
    while k < t1:
        x = ts(0.06)
        add(fx, np.sin(2 * np.pi * (140 + 200 * np.exp(-x * 80)) * x) * env(len(x), 0.001, 0.015), k, g)
        k += every


def s_thunder(t, g=0.8):
    d = 2.5
    n = noise(d)
    x = ts(d)
    crack = (n - onepole(n, 0.4)) * np.exp(-x * 12) * 1.5
    rumble = onepole(n, 0.01) * 14 * np.exp(-x * 1.2) * (0.7 + 0.3 * np.sin(2 * np.pi * 3 * x))
    add(fx, crack + rumble, t, g)


def s_rain(t, t1=5.0, g=0.25):
    d = t1 - t
    n = noise(d)
    x = ts(d)
    hiss = n - onepole(n, 0.25)
    a = np.minimum(1, x / 0.8) * np.minimum(1, (d - x) / 0.4)
    add(fx, hiss * a * 1.2, t, g)


def s_splash(t, g=0.35):
    n = noise(0.3)
    add(fx, onepole(n, np.linspace(0.6, 0.05, len(n))) * env(len(n), 0.002, 0.08) * 2.5, t, g)


def s_birds(t, g=0.18):
    for k in range(5):
        d = 0.12
        x = ts(d)
        f = 3000 + 1500 * np.sin(np.pi * x / d) + rng.uniform(-300, 300)
        add(fx, sweep(f, d) * np.sin(np.pi * x / d), t + k * 0.22 + rng.uniform(0, 0.05) + (0.6 if k > 2 else 0), g)


def s_drip(t, g=0.3):
    x = ts(0.12)
    add(fx, sweep(800 + 1400 * x / 0.12, 0.12) * env(len(x), 0.001, 0.03), t, g)



def s_doorbell(t, g=0.35):
    for k, fr in enumerate([1318.5, 1046.5]):
        x = ts(0.9)
        add(fx, (np.sin(2 * np.pi * fr * x) + 0.3 * np.sin(2 * np.pi * fr * 3 * x)) * env(len(x), 0.002, 0.35), t + k * 0.45, g)


def s_honk(t, g=0.3, d=0.35):
    x = ts(d)
    w = np.sign(np.sin(2 * np.pi * 415 * x)) + np.sign(np.sin(2 * np.pi * 523 * x))
    add(fx, onepole(w * 0.5, 0.2) * env(len(x), 0.005) * np.minimum(1, (d - x) / 0.03), t, g)


def s_shutter(t, g=0.45):
    for k in (0, 0.06):
        n = noise(0.04)
        add(fx, (n - onepole(n, 0.4)) * env(len(n), 0.0005, 0.01) * 1.5, t + k, g)


def s_type(t, t1=2.0, g=0.18):
    k = t
    while k < t1:
        n = noise(0.015)
        add(fx, (n - onepole(n, 0.5)) * env(len(n), 0.0005, 0.004), k, g * rng.uniform(0.6, 1.0))
        k += rng.uniform(0.05, 0.11)


def s_stretch(t, g=0.4, d=0.7):
    x = ts(d)
    add(fx, sweep(120 + 500 * (x / d) ** 2 + 30 * np.sin(2 * np.pi * 25 * x), d) * env(len(x), 0.01) * np.minimum(1, (d - x) / 0.05), t, g)


def s_zzz(t, g=0.15):
    d = 1.2
    x = ts(d)
    add(fx, onepole(noise(d), 0.05) * np.sin(np.pi * x / d) ** 2 * 3, t, g)


def s_alarm(t, t1=2.0, g=0.22):
    k = t
    while k < t1:
        for j in range(4):
            x = ts(0.045)
            add(fx, np.sign(np.sin(2 * np.pi * 2100 * x)) * env(len(x), 0.002), k + j * 0.075, g)
        k += 0.5


def s_creak(t, g=0.35, d=1.2):
    x = ts(d)
    f = 180 + 60 * np.sin(2 * np.pi * 0.8 * x) + 40 * np.sin(2 * np.pi * 7 * x)
    saw = (np.cumsum(f) / SR) % 1 * 2 - 1
    gate = (np.sin(2 * np.pi * 30 * x) > 0.3)
    add(fx, onepole(saw * gate, 0.25) * np.sin(np.pi * x / d) * 1.5, t, g)


def s_sizzle(t, t1=2.0, g=0.18):
    d = t1 - t
    n = noise(d)
    x = ts(d)
    crackle = (rng.random(len(n)) > 0.995) * rng.uniform(-1, 1, len(n)) * 3
    add(fx, ((n - onepole(n, 0.5)) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * x)) + crackle) * np.minimum(1, x / 0.3), t, g)


def s_buzz(t, g=0.3, n=2):
    for k in range(int(n)):
        x = ts(0.25)
        add(fx, np.sign(np.sin(2 * np.pi * 150 * x)) * 0.4 * onepole(np.ones(len(x)), 0.002), t + k * 0.35, g)


def s_ring(t, t1=2.0, g=0.25):
    k = t
    while k < t1:
        for j in range(2):
            x = ts(0.4)
            add(fx, (np.sin(2 * np.pi * 880 * x) + np.sin(2 * np.pi * 1108 * x)) * 0.5 * env(len(x), 0.01) * (np.sin(2 * np.pi * 20 * x) > 0), k + j * 0.5, g)
        k += 2.0

for ev in tl["sfx"]:
    name, t, opts = ev[0], ev[1], (ev[2] if len(ev) > 2 else {})
    globals()["s_" + name](t, **opts)

mix = music * 0.8 + fx
mix = np.tanh(mix * 1.1) * 0.9
f = int(0.35 * SR)
mix[-f:] *= np.linspace(1, 0, f)
R = np.concatenate([np.zeros(int(0.008 * SR)), mix])[:N]
st = (np.stack([mix, R], 1) * 32767).astype(np.int16)
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
print("wrote", sys.argv[2])
