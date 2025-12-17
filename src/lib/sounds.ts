// Sound Effects Manager for T³
// Uses Web Audio API for game sounds

class SoundManager {
    private audioContext: AudioContext | null = null;
    private enabled: boolean = true;
    private volume: number = 0.5;

    private getContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return this.audioContext;
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (typeof window !== 'undefined') {
            localStorage.setItem('ttt-sound-enabled', String(enabled));
        }
    }

    isEnabled(): boolean {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ttt-sound-enabled');
            if (saved !== null) {
                this.enabled = saved === 'true';
            }
        }
        return this.enabled;
    }

    setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    // Generate a simple beep/click sound
    private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', decay: number = 0.3): void {
        if (!this.enabled || typeof window === 'undefined') return;

        try {
            const ctx = this.getContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

            gainNode.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration * decay);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration);
        } catch (e) {
            // Audio not supported
        }
    }

    // Piece placement sound - soft click
    playPlace(): void {
        this.playTone(800, 0.1, 'sine', 0.5);
        setTimeout(() => this.playTone(600, 0.05, 'sine', 0.3), 30);
    }

    // Takeover sound - dramatic swap
    playTakeover(): void {
        this.playTone(300, 0.15, 'sawtooth', 0.4);
        setTimeout(() => this.playTone(500, 0.1, 'square', 0.3), 50);
        setTimeout(() => this.playTone(700, 0.1, 'sine', 0.3), 100);
    }

    // Win celebration
    playWin(): void {
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.5), i * 100);
        });
    }

    // Lose/opponent wins
    playLose(): void {
        this.playTone(300, 0.3, 'sawtooth', 0.8);
        setTimeout(() => this.playTone(200, 0.4, 'sawtooth', 0.9), 150);
    }

    // Invalid move / error
    playError(): void {
        this.playTone(200, 0.15, 'square', 0.3);
        setTimeout(() => this.playTone(150, 0.15, 'square', 0.3), 80);
    }

    // Hover sound - very subtle
    playHover(): void {
        this.playTone(1200, 0.03, 'sine', 0.2);
    }

    // Turn change notification
    playTurnChange(): void {
        this.playTone(880, 0.08, 'sine', 0.4);
    }

    // Button click
    playClick(): void {
        this.playTone(600, 0.05, 'sine', 0.3);
    }
}

// Haptic feedback for mobile
export function vibrate(pattern: number | number[]): void {
    if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// Singleton instance
export const sounds = new SoundManager();

// Convenience functions
export const playPlace = () => { sounds.playPlace(); vibrate(10); };
export const playTakeover = () => { sounds.playTakeover(); vibrate([20, 30, 20]); };
export const playWin = () => { sounds.playWin(); vibrate([50, 50, 50, 50, 100]); };
export const playLose = () => { sounds.playLose(); vibrate([100, 50, 100]); };
export const playError = () => { sounds.playError(); vibrate(50); };
export const playHover = () => sounds.playHover();
export const playTurnChange = () => { sounds.playTurnChange(); vibrate(15); };
export const playClick = () => { sounds.playClick(); vibrate(5); };
