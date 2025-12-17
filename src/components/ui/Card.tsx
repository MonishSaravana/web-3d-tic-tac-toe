// Card Component

'use client';

import { HTMLAttributes, forwardRef } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({
        children,
        variant = 'default',
        padding = 'md',
        hover = false,
        className = '',
        ...props
    }, ref) => {
        const classes = [
            styles.card,
            styles[variant],
            styles[`padding-${padding}`],
            hover ? styles.hover : '',
            className,
        ].filter(Boolean).join(' ');

        return (
            <div ref={ref} className={classes} {...props}>
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';
