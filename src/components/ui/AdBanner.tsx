// Ad Banner Component for Google AdSense
// Provides a reusable ad slot that can be placed throughout the app

'use client';

import { useEffect, useRef } from 'react';
import styles from './AdBanner.module.css';

interface AdBannerProps {
    slot?: string; // Ad unit slot ID from AdSense (optional - uses auto ads if not provided)
    format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
    className?: string;
}

export function AdBanner({ slot, format = 'auto', className = '' }: AdBannerProps) {
    const adRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    useEffect(() => {
        // Only initialize once and only in browser
        if (typeof window === 'undefined' || initialized.current) return;

        try {
            // Push ad to AdSense
            const adsbygoogle = (window as any).adsbygoogle || [];
            adsbygoogle.push({});
            initialized.current = true;
        } catch (e) {
            // AdSense not loaded or blocked
            console.log('AdSense not available');
        }
    }, []);

    // Get responsive style based on format
    const getStyle = () => {
        switch (format) {
            case 'horizontal':
                return { minHeight: '90px' };
            case 'vertical':
                return { minHeight: '250px', maxWidth: '300px' };
            case 'rectangle':
                return { minHeight: '250px', maxWidth: '336px' };
            default:
                return { minHeight: '100px' };
        }
    };

    return (
        <div className={`${styles.adContainer} ${className}`} style={getStyle()} ref={adRef}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-2576947283789645"
                data-ad-slot={slot}
                data-ad-format={format === 'auto' ? 'auto' : undefined}
                data-full-width-responsive={format === 'auto' ? 'true' : undefined}
            />
        </div>
    );
}

export default AdBanner;
