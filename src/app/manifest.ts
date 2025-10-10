
import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GoSwamiX Learning App',
    short_name: 'GoSwamiX',
    description: 'Your path to success starts here. Learn with GoSwamiX.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1A001A',
    theme_color: '#6c2bd9',
    icons: [
      {
        src: '/go-swami-logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/go-swami-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      },
    ],
  }
}
