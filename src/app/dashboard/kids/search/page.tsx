
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, where, limit } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Link from 'next/link';

export default function SearchPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [submittedSearch, setSubmittedSearch] = useState('');

    const videosQuery = submittedSearch 
        ? query(
            collection(firestore, 'kidsTubeVideos'),
            // Firestore doesn't support full-text search natively.
            // A simple "greater than or equal to" can act as a basic prefix search.
            where('title', '>=', submittedSearch),
            where('title', '<=', submittedSearch + '\uf8ff'),
            limit(20)
        )
        : query(
            collection(firestore, 'kidsTubeVideos'),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

    const [videos, loading, error] = useCollection(videosQuery);
    
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittedSearch(searchTerm);
    }
    
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <form onSubmit={handleSearch} className="flex w-full items-center space-x-2">
                <Input 
                    type="text" 
                    placeholder="Search for videos..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit">
                    <Search className="h-4 w-4" />
                </Button>
            </form>

            <div>
                <h2 className="text-xl font-bold mb-4">{submittedSearch ? `Results for "${submittedSearch}"` : "Recent Videos"}</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {loading && [...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="w-full aspect-video" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    ))}
                    {error && <p className="text-destructive col-span-full">Error: {error.message}</p>}
                    
                    {!loading && videos?.docs.length === 0 && (
                        <p className="text-muted-foreground col-span-full text-center py-8">No videos found.</p>
                    )}

                    {videos?.docs.map(doc => {
                        const video = doc.data();
                        return (
                             <Link href={`/dashboard/kids/video/${doc.id}`} key={doc.id} className="flex flex-col gap-2 cursor-pointer group">
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden shrink-0 bg-muted">
                                    <Image src={video.thumbnailUrl || `https://picsum.photos/seed/${doc.id}/300/180`} alt={video.title} fill style={{objectFit: "cover"}} className="group-hover:scale-105 transition-transform duration-300" />
                                </div>
                                <div>
                                    <h3 className="font-semibold line-clamp-2 group-hover:text-primary">{video.title}</h3>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
