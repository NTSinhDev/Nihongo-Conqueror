/**
 * Sound synthesizer using Web Audio API for rewarding correct answers and friendly error bleeps.
 * It also handles Japanese speech synthesis for native Hiragana pronunciation.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
      } catch (e) {
        console.warn("Web Audio API is not supported in this environment.", e);
      }
    }
    // Resume audio context if suspended (browser security autoplay policies)
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  /**
   * Beautiful double-frequency synthetic chime representing successful match or answer
   */
  playSuccess() {
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      // Sweet sounding pentatonic intervals (E5 and B5)
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.linearRampToValueAtTime(880.00, now + 0.15); // A5

      osc2.frequency.setValueAtTime(987.77, now); // B5
      osc2.frequency.linearRampToValueAtTime(1318.51, now + 0.15); // E6

      gainNode.gain.setValueAtTime(0.0, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Safe, friendly, descending slide sound effect indicating an error
   */
  playFailure() {
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(261.63, now); // C4
      osc.frequency.linearRampToValueAtTime(164.81, now + 0.25); // E3

      gainNode.gain.setValueAtTime(0.0, now);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Sound indicating a clean slate / system click
   */
  playClick() {
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(1500, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }
}

export const sounds = new SoundEngine();

/**
 * Text-To-Speech for Japanese syllables.
 */
export function speakJapanese(text: string) {
  if (!("speechSynthesis" in window)) {
    console.warn("TTS is not supported in this browser.");
    return;
  }

  try {
    // Cancel any active utterance
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    
    // Find a proper Japanese voice if available
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(v => v.lang.startsWith("ja") || v.lang === "ja-JP");
    if (jaVoice) {
      utterance.voice = jaVoice;
    }

    utterance.rate = 0.8; // Friendly learning pace
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Error speaking Japanese syllable", err);
  }
}
