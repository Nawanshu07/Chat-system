// Web Audio API Sound System — Zero external files, zero latency, works 100% offline in APK/PWA
// Designed with acoustic warm harmonics, low-pass filtering, and minimal luxury tones

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('chat_sound_enabled') !== 'false'; // default true
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(val) {
    this.enabled = !!val;
    localStorage.setItem('chat_sound_enabled', this.enabled ? 'true' : 'false');
    if (this.enabled) {
      this.playSent(); // short pleasant confirmation sound
    }
  }

  // Velvety, warm "swoosh-pop" for sent message (Apple/Telegram acoustic feel)
  playSent() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);

      osc.type = 'sine';
      // Smooth upward frequency slide (440Hz -> 880Hz)
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.075);

      // Smooth attack and decay envelope
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);

      // Subtle haptic feedback for mobile devices
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch (e) {
      // AudioContext might be blocked until user gesture, safely ignore
    }
  }

  // Gentle two-tone marimba chime with harmonic overtones for received message
  playReceived() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Note 1: E5 (659.25Hz) with acoustic warm body
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      const filter1 = this.ctx.createBiquadFilter();
      filter1.type = 'lowpass';
      filter1.frequency.setValueAtTime(4000, now);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(0.2, now + 0.018);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc1.connect(filter1);
      filter1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.23);

      // Note 2: A5 (880Hz) — staggered by 55ms
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      const filter2 = this.ctx.createBiquadFilter();
      filter2.type = 'lowpass';
      filter2.frequency.setValueAtTime(4500, now + 0.055);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.055);

      gain2.gain.setValueAtTime(0.0001, now + 0.055);
      gain2.gain.linearRampToValueAtTime(0.22, now + 0.075);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc2.connect(filter2);
      filter2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.055);
      osc2.stop(now + 0.36);

      // Mobile haptic pattern: double tap
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([15, 35, 15]);
      }
    } catch (e) {
      // Safely ignore
    }
  }

  // Gentle pop for emoji reaction
  playReaction() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1040, now + 0.05);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {
      // Safely ignore
    }
  }

  // Tactile micro-tick for subtle UI clicks
  playTap() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.03);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {}
  }
}

export const sound = new SoundManager();
