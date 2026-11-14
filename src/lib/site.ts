// Canonical origin for metadata, sitemap and structured data.
// Override with NEXT_PUBLIC_SITE_URL for preview deployments.

export const SITE_URL = (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://3dttt.monishsaravana.com'
).replace(/\/$/, '');

export const SITE_NAME = '3D T³';
