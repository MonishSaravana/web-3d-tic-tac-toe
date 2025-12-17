// Input Component

'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, fullWidth = false, className = '', id, ...props }, ref) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

        const containerClasses = [
            styles.container,
            fullWidth ? styles.fullWidth : '',
            error ? styles.hasError : '',
            className,
        ].filter(Boolean).join(' ');

        return (
            <div className={containerClasses}>
                {label && (
                    <label htmlFor={inputId} className={styles.label}>
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={styles.input}
                    {...props}
                />
                {error && (
                    <span className={styles.error}>{error}</span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
