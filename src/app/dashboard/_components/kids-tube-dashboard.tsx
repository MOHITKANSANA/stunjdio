
"use client";

import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';

export default function KidsTubeDashboard() {
    const [videos, loading, error] = useCollection(
        query(collection(firestore, 'kidsTubeVideos'), orderBy('createdAt', 'desc'))
    );
    
    if (loading) return (
        <div className="p-4 md:p-6 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="w-full aspect-video" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    );

    if (error) return <p className="text-destructive p-4 md:p-6">Error loading videos.</p>;
    
    if (!videos || videos.empty) return (
        <div className="p-4 md:p-6 text-center">
            <PlayCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4">No videos available right now. Check back soon!</p>
        </div>
    );

    return (
        <div className="p-4 md:p-6">
             <h1 className="text-3xl font-bold mb-6">Kids Tube</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
                {videos.docs.map(doc => {
                    const video = doc.data();
                    return (
                        <Link href={`/dashboard/kids/video/${doc.id}`} key={doc.id} className="group">
                           <div className="relative w-full aspect-video rounded-lg overflow-hidden shrink-0 bg-muted shadow-lg group-hover:shadow-xl transition-shadow">
                               <Image src={video.thumbnailUrl || `https://picsum.photos/seed/${doc.id}/300/180`} alt={video.title} fill style={{objectFit: "cover"}} className="group-hover:scale-105 transition-transform duration-300" />
                           </div>
                           <div className="pt-3">
                               <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">{video.title}</h3>
                               <p className="text-sm text-muted-foreground">Go Swami Coaching Classes</p>
                           </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
