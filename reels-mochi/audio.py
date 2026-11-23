"""Synthesize music + sound effects for the Mochi reel -> audio.wav (16 s, 44.1 kHz stereo)."""
import sys, wave
import numpy as np

SR, DUR = 44100, 16.0
N = int(SR * DUR)
music = np.zeros(N)
sfx = np.zeros(N)
rng = np.random.default_rng(7)


def add(buf, sig, t, gain=1.0):
    i = int(t * SR)
    j = min(N, i + len(sig))
    if i < N:
        buf[i:j] += sig[: j - i] * gain


def env(n, a=0.005, r=None):
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    if r:
        e *= np.exp(-np.arange(n) / (r * SR))
    return e


def pluck(freq, dur=0.9):
    """Karplus-Strong ukulele-ish pluck."""
    n = int(dur * SR)
    p = int(SR / freq)
    buf = rng.uniform(-1, 1, p)
    out = np.empty(n)
    for k in range(n):
        out[k] = buf[k % p]
        buf[k % p] = 0.5 * (buf[k % p] + buf[(k + 1) % p]) * 0.996
    return out * env(n, 0.002)


def tone(freq, dur, kind="sine"):
    t = np.arange(int(dur * SR)) / SR
    if kind == "square":
        return np.sign(np.sin(2 * np.pi * freq * t))
    return np.sin(2 * np.pi * freq * t)


def noise(dur):
    return rng.uniform(-1, 1, int(dur * SR))


def lowpass(x, a):
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


# ---------------- music: cheerful ukulele loop, 112 bpm ----------------
BPM = 112
beat = 60 / BPM
chords = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]]  # C Am F G
melody = [76, 79, 81, 79, 76, 74, 72, 74, 72, 69, 72, 74, 76, 74, 71, 67]
cache = {}


def cpluck(m, d=0.8):
    if (m, d) not in cache:
        cache[(m, d)] = pluck(midi(m), d)
    return cache[(m, d)]


def music_section(t0, t1, gain=1.0):
    b = 0
    while True:
        t = t0 + b * beat
        if t >= t1:
            break
        ch = chords[(b // 4) % 4]
        # strum on each beat (down-strum, tiny delays)
        for k, m in enumerate(ch):
            add(music, cpluck(m), t + k * 0.012, 0.16 * gain * (1 if b % 2 == 0 else 0.7))
        # off-beat strum
        for k, m in enumerate(ch[1:]):
            add(music, cpluck(m, 0.4), t + beat / 2 + k * 0.01, 0.08 * gain)
        # bass
        bn = tone(midi(ch[0] - 24), beat * 0.9) * env(int(beat * 0.9 * SR), 0.01, 0.25)
        add(music, bn, t, 0.32 * gain)
        # melody (8th notes every other bar)
        if (b // 4) % 2 == 1:
            add(music, cpluck(melody[(b * 2) % 16] , 0.5), t, 0.12 * gain)
            add(music, cpluck(melody[(b * 2 + 1) % 16], 0.5), t + beat / 2, 0.10 * gain)
        # shaker
        for h in (0, 0.5):
            sh = lowpass(noise(0.05), 0.6)
            sh = (noise(0.05) - sh) * env(len(sh), 0.002, 0.012)
            add(music, sh, t + h * beat, 0.06 * gain)
        b += 1


music_section(0.0, 10.55, 1.0)       # stops dead at record-scratch
music_section(13.0, 16.0, 0.85)      # resumes for the happy ending

# ---------------- sfx ----------------
def pop(t, f=600, g=0.5):
    d = 0.09
    tt = np.arange(int(d * SR)) / SR
    s = np.sin(2 * np.pi * (f + 900 * np.exp(-tt * 60)) * tt) * env(len(tt), 0.001, 0.025)
    add(sfx, s, t, g)


def whoosh(t, d=0.45, g=0.5, up=True):
    n = noise(d)
    tt = np.linspace(0, 1, len(n))
    a = (0.05 + 0.5 * tt) if up else (0.55 - 0.5 * tt)
    out = np.empty_like(n); acc = 0.0
    for i, v in enumerate(n):
        acc += a[i] * (v - acc); out[i] = acc
    add(sfx, out * np.sin(np.pi * tt) ** 1.5 * 2.2, t, g)


def boing(t, g=0.5):
    d = 0.6
    tt = np.arange(int(d * SR)) / SR
    f = 180 + 260 * tt / d + 40 * np.sin(2 * np.pi * 18 * tt)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.003, 0.25)
    add(sfx, s, t, g)


def alarm(t0, t1, g=0.22):
    t = t0
    while t < t1:
        for k in range(4):
            add(sfx, tone(2100, 0.045, "square") * env(int(0.045 * SR), 0.002), t + k * 0.075, g)
        t += 0.5


def step(t, g=0.35):
    d = 0.06
    tt = np.arange(int(d * SR)) / SR
    s = np.sin(2 * np.pi * (140 + 200 * np.exp(-tt * 80)) * tt) * env(len(tt), 0.001, 0.015)
    add(sfx, s, t, g)


def scratch(t, g=0.55):
    d = 0.55
    n = noise(d)
    tt = np.arange(len(n)) / SR
    mod = np.abs(np.sin(2 * np.pi * 7 * tt))
    out = lowpass(n, 0.35) * mod * env(len(n), 0.002, 0.3) * 2.5
    tonal = np.sin(2 * np.pi * np.cumsum(300 + 900 * mod) / SR) * 0.3 * env(len(n), 0.002, 0.2)
    add(sfx, out + tonal, t, g)


def ding(t, f=1318.5, g=0.35):
    d = 1.4
    tt = np.arange(int(d * SR)) / SR
    s = (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt)) * env(len(tt), 0.002, 0.4)
    add(sfx, s, t, g)


def tada(t, g=0.3):
    for k, m in enumerate([72, 76, 79, 84]):
        add(sfx, cpluck(m, 1.2), t + k * 0.07, g)


def snore(t, g=0.18):
    d = 1.0
    tt = np.arange(int(d * SR)) / SR
    s = lowpass(noise(d), 0.08) * np.sin(np.pi * tt / d) ** 2 * (1 + 0.5 * np.sin(2 * np.pi * 30 * tt)) * 3
    add(sfx, s, t, g)


# timeline (matches mochi.html)
snore(0.2); pop(0.25, 700, .45); pop(0.1, 500, .3)
alarm(1.35, 3.0); pop(1.4, 900, .4)
whoosh(2.85, 0.3, .5); boing(3.0, .6); pop(3.4, 700, .5)
pop(4.0, 1000, .25)
whoosh(5.75, 0.5, .65)
t = 6.15
while t < 9.95:
    step(t, .3); t += 0.12
pop(6.4, 800, .5); pop(7.95, 650, .45)
whoosh(9.6, 0.4, .55, up=False); whoosh(10.0, 0.4, .45)
scratch(10.6)
whoosh(11.15, 0.25, .35, up=False); ding(11.6, g=.4); tada(11.55, .28); pop(11.55, 700, .5)
whoosh(12.85, 0.35, .5); boing(13.2, .4); pop(13.35, 750, .5)
for k in range(7):
    pop(13.5 + k * 0.28, 1100 + k * 80, .22)
ding(14.4, 1760, .25); pop(14.45, 600, .4)

# ---------------- mix ----------------
mix = music * 0.8 + sfx
mix = np.tanh(mix * 1.1) * 0.9
fade = int(0.35 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)
L = mix
R = np.concatenate([np.zeros(int(0.008 * SR)), mix])[:N]  # tiny stereo widening
st = (np.stack([L, R], 1) * 32767).astype(np.int16)
out = sys.argv[1] if len(sys.argv) > 1 else "audio.wav"
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
print("wrote", out)
