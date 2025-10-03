
'use client';

import {
  BookOpen,
  Book,
  Video,
  Lightbulb,
  Swords,
  Trophy,
  Calendar,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Autoplay from "embla-carousel-autoplay"


const featureCards = [
  {
    label: 'Daily Learning',
    icon: BookOpen,
    href: '/dashboard/daily-learning',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    label: 'Notes & PDFs',
    icon: Book,
    href: '/dashboard/my-learning',
    color: 'from-green-500 to-emerald-600',
  },
  {
    label: 'Video Lectures',
    icon: Video,
    href: '/dashboard/courses',
    color: 'from-red-500 to-rose-600',
  },
  {
    label: 'Motivation',
    icon: Lightbulb,
    href: '/dashboard/motivation',
    color: 'from-yellow-500 to-amber-600',
  },
  {
    label: 'Battle Quiz',
    icon: Swords,
    href: '/dashboard/quiz',
    color: 'from-orange-500 to-red-500',
  },
  {
    label: 'Leaderboard',
    icon: Trophy,
    href: '/dashboard/leaderboard',
    color: 'from-purple-500 to-violet-600',
  },
  {
    label: 'Study Planner',
    icon: Calendar,
    href: '/dashboard/planner',
    color: 'from-pink-500 to-rose-500',
  },
  {
    label: 'Community',
    icon: Users,
    href: '/dashboard/community',
    color: 'from-teal-500 to-cyan-600',
  },
];

const carouselImages = [
    { src: 'https://picsum.photos/seed/promo1/1200/600', alt: 'Promotion 1', 'data-ai-hint': 'study class' },
    { src: 'https://picsum.photos/seed/promo2/1200/600', alt: 'Promotion 2', 'data-ai-hint': 'teacher lecture' },
    { src: 'https://picsum.photos/seed/promo3/1200/600', alt: 'Promotion 3', 'data-ai-hint': 'students writing' },
]

export default function MindSpherePage() {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-primary/10 via-background to-background space-y-6">
      <h1 className="text-2xl font-bold">Hello, Student!</h1>
      
      <Carousel 
        opts={{ loop: true }} 
        plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
        className="w-full"
      >
        <CarouselContent>
          {carouselImages.map((image, index) => (
            <CarouselItem key={index}>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-w-16 aspect-h-9">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      style={{objectFit: 'cover'}}
                      priority={index === 0}
                      data-ai-hint={image['data-ai-hint']}
                    />
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {featureCards.map((item) => (
          <Link href={item.href} key={item.label}>
            <Card
              className={cn(
                'transform-gpu text-white transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-xl rounded-xl bg-gradient-to-br',
                item.color
              )}
            >
              <CardContent className="flex flex-col items-center justify-center gap-2 p-4 h-full aspect-square">
                <item.icon className="h-8 w-8" />
                <span className="text-sm font-semibold text-center">
                  {item.label}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
