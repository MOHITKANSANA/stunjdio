
import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Learn with Munedra',
    short_name: 'LearnWithMunedra',
    description: 'Your path to success starts here. Learn with Munedra.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1A001A',
    theme_color: '#6c2bd9',
    icons: [
      {
        src: '/go-swami-logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
       {
        src: '/go-swami-logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/go-swami-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
       {
        src: '/go-swami-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
    ],
  }
}
