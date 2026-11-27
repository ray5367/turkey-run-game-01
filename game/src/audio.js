// Turkey Trot — all sound is synthesized with WebAudio. No audio files, no
// network: every gobble, ding, whoosh and the little autumn tune are built
// from oscillators and filtered noise in code.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.muted = false;
    this.musicTimer = null;
    this.step = 0;
    // A short, jaunty loop in C major pentatonic. Each entry is
    // [melody midi, bass midi, beats]. 0 means rest.
    this.tune = [
      [72, 48, 1], [76, 48, 1], [79, 55, 1], [76, 55, 1],
      [74, 53, 1], [76, 53, 1], [79, 55, 2],
      [81, 57, 1], [79, 55, 1], [76, 53, 1], [74, 48, 1],
      [72, 48, 1], [74, 53, 1], [76, 55, 2],
      [67, 48, 1], [72, 48, 1], [74, 53, 1], [76, 55, 1],
      [79, 55, 1], [81, 57, 1], [84, 60, 2],
      [79, 55, 1], [76, 53, 1], [74, 53, 1], [72, 48, 2],
    ];
    this.beatSec = 0.21;
  }

  // Called from the first user gesture; browsers block audio before one.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.16;
    this.musicGain.connect(this.master);
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }

  midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  tone({ freq = 440, freqEnd = null, type = 'sine', dur = 0.15, vol = 0.5, when = 0, slide = false }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (freqEnd !== null) {
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
      else o.frequency.linearRampToValueAtTime(freqEnd, t0 + dur);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  noise({ dur = 0.2, vol = 0.4, freq = 1200, q = 0.8, when = 0 }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t0);
  }

  gobble() {
    // Two quick descending clucks, the turkey's hello.
    this.tone({ freq: 420, freqEnd: 300, type: 'square', dur: 0.09, vol: 0.22 });
    this.tone({ freq: 360, freqEnd: 240, type: 'square', dur: 0.11, vol: 0.22, when: 0.1 });
  }

  pickup(kind) {
    if (kind === 'feather') {
      [880, 1108, 1318, 1760].forEach((f, i) => this.tone({ freq: f, dur: 0.14, vol: 0.3, when: i * 0.06 }));
    } else if (kind === 'pie') {
      [660, 880, 990].forEach((f, i) => this.tone({ freq: f, dur: 0.12, vol: 0.28, when: i * 0.05 }));
    } else {
      this.tone({ freq: 740, dur: 0.1, vol: 0.26 });
      this.tone({ freq: 988, dur: 0.12, vol: 0.26, when: 0.06 });
    }
  }

  dash() {
    this.noise({ dur: 0.22, vol: 0.35, freq: 2600, q: 0.6 });
  }

  jump() {
    this.tone({ freq: 300, freqEnd: 560, type: 'sine', dur: 0.14, vol: 0.2, slide: true });
  }

  alarm() {
    // Spotted! Two-tone siren blip.
    this.tone({ freq: 700, type: 'square', dur: 0.12, vol: 0.22 });
    this.tone({ freq: 940, type: 'square', dur: 0.12, vol: 0.22, when: 0.13 });
    this.tone({ freq: 700, type: 'square', dur: 0.12, vol: 0.22, when: 0.26 });
  }

  hurt() {
    this.tone({ freq: 180, freqEnd: 70, type: 'sawtooth', dur: 0.3, vol: 0.32, slide: true });
    this.noise({ dur: 0.18, vol: 0.25, freq: 500, q: 1 });
  }

  caught() {
    // Descending minor sting: dinner is served.
    [392, 370, 349, 311].forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.3, vol: 0.3, when: i * 0.22 }));
  }

  escaped() {
    // Fanfare: the turkey lives to gobble another day.
    [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.tone({ freq: f, type: 'triangle', dur: 0.22, vol: 0.3, when: i * 0.11 }));
    this.tone({ freq: 1318, type: 'triangle', dur: 0.5, vol: 0.28, when: 0.7 });
  }

  knifeWarn() {
    this.tone({ freq: 1200, freqEnd: 900, type: 'sine', dur: 0.12, vol: 0.14, slide: true });
  }

  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    this.musicTimer = setInterval(() => this.playStep(), this.beatSec * 1000);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  playStep() {
    if (!this.ctx || this.muted) return;
    const [mel, bass] = this.tune[this.step % this.tune.length];
    this.step += 1;
    if (mel) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = this.midiToFreq(mel);
      g.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.5, this.ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + this.beatSec * 0.95);
      o.connect(g);
      g.connect(this.musicGain);
      o.start();
      o.stop(this.ctx.currentTime + this.beatSec);
    }
    if (bass && this.step % 2 === 1) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.value = this.midiToFreq(bass - 12);
      g.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.6, this.ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + this.beatSec * 1.8);
      o.connect(g);
      g.connect(this.musicGain);
      o.start();
      o.stop(this.ctx.currentTime + this.beatSec * 2);
    }
  }
}
