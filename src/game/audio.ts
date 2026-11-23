export class GameAudio {
  private context: AudioContext | null = null;
  muted = false;

  play(kind: 'clue' | 'bark' | 'alert' | 'throw' | 'hurt' | 'win') {
    if (this.muted) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') void this.context.resume();
      const context = this.context;
      const notes = kind === 'win' ? [523, 659, 784, 1047] : kind === 'bark' ? [310, 220] : kind === 'alert' ? [175, 140] : kind === 'hurt' ? [220, 110] : kind === 'throw' ? [500, 300] : [650, 880];
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + index * 0.1;
        oscillator.type = kind === 'bark' || kind === 'hurt' ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.075, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.17);
      });
    } catch { return; }
  }

  destroy() {
    if (this.context) void this.context.close();
    this.context = null;
  }
}