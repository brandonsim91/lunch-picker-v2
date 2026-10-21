import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '밥Lah',
    short_name: '밥Lah',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFF8ED',
    theme_color: '#FFF8ED',
    icons: [
      { src: '/icon-192.png?v=3', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png?v=3', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
