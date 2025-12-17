// Move Timer Component
// Displays countdown timer for player moves

'use client';

import { useEffect, useState, useRef } from 'react';
import styles from './MoveTimer.module.css';

export type TimerMode = 'unlimited' | 'per_move' | 'time_bank';

interface MoveTimerProps {
    mode: TimerMode;
    timePerMove?: number; // seconds for per_move mode
    timeRemaining?: number; // seconds for time_bank mode
    isActive: boolean; // timer running for this player
    onTimeUp?: () => void;
    onTimeChange?: (remaining: number) => void;
}

export function MoveTimer({
    mode,
    timePerMove = 30,
    timeRemaining = 120,
    isActive,
    onTimeUp,
    onTimeChange,
}: MoveTimerProps) {
    const [seconds, setSeconds] = useState(() => {
        if (mode === 'per_move') return timePerMove;
        if (mode === 'time_bank') return timeRemaining;
        return 0;
    });

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Reset on mode or turn change
    useEffect(() => {
        if (mode === 'per_move') {
            setSeconds(timePerMove);
        } else if (mode === 'time_bank') {
            setSeconds(timeRemaining);
        }
    }, [mode, timePerMove, timeRemaining, isActive]);

    // Countdown logic
    useEffect(() => {
        if (mode === 'unlimited' || !isActive) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = setInterval(() => {
            setSeconds(prev => {
                const newValue = prev - 1;
                if (newValue <= 0) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    onTimeUp?.();
                    return 0;
                }
                onTimeChange?.(newValue);
                return newValue;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [mode, isActive, onTimeUp, onTimeChange]);

    if (mode === 'unlimited') {
        return null;
    }

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeString = `${minutes}:${secs.toString().padStart(2, '0')}`;

    const isLow = seconds <= 10;
    const isCritical = seconds <= 5;

    return (
        <div
            className={`${styles.timer} ${isActive ? styles.active : ''} ${isLow ? styles.low : ''} ${isCritical ? styles.critical : ''}`}
        >
            <div className={styles.timeDisplay}>{timeString}</div>
            <div className={styles.modeLabel}>
                {mode === 'per_move' ? 'Per Move' : 'Time Bank'}
            </div>
            {isLow && isActive && (
                <div className={styles.warningPulse} />
            )}
        </div>
    );
}
