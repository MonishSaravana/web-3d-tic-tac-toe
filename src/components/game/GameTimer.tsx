// Game Elapsed Timer Component
// Shows time elapsed since game started

'use client';

import { useEffect, useState, useRef } from 'react';
import styles from './GameTimer.module.css';

interface GameTimerProps {
    isRunning: boolean; // pauses when game ends
    startTime?: number; // timestamp when game started
}

export function GameTimer({ isRunning, startTime }: GameTimerProps) {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startRef = useRef<number>(startTime || Date.now());

    useEffect(() => {
        if (startTime) {
            startRef.current = startTime;
        }
    }, [startTime]);

    useEffect(() => {
        if (!isRunning) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = setInterval(() => {
            const now = Date.now();
            setElapsedSeconds(Math.floor((now - startRef.current) / 1000));
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning]);

    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div className={styles.timer}>
            <span className={styles.icon}>⏱</span>
            <span className={styles.time}>{timeString}</span>
        </div>
    );
}
