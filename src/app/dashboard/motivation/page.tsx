
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Film, GalleryHorizontal, Video, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const motivationalLines = [
    "विश्वास करो कि तुम कर सकते हो और तुम आधा रास्ता तय कर चुके हो।",
    "महान कार्य करने का एकमात्र तरीका यह है कि आप जो करते हैं उससे प्यार करें।",
    "सफलता खुशी की कुंजी नहीं है। खुशी सफलता की कुंजी है।",
    "घड़ी मत देखो; वह करो जो वह करती है। चलते रहो।",
    "भविष्य उनका है जो अपने सपनों की सुंदरता में विश्वास करते हैं।"
];

const ShortsTab = () => {
    const q = query(collection(firestore, 'motivationVideos'), where('type', '==', 'short_video'), orderBy('createdAt', 'desc'));
    const [videos, loading, error] = useCollectionData(q);

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="w-full aspect-[9/16] rounded-lg" />
                ))}
            </div>
        )
    }
    
    if (error) {
        return <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Could not load videos</AlertTitle>
            <AlertDescription className="text-xs">{error.message}</AlertDescription>
        </Alert>
    }

    if (!videos || videos.length === 0) {
        return (
            <div className="text-center text-muted-foreground p-8">
                <Film className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Motivational Shorts</h3>
                <p>Short videos will be added here soon.</p>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {videos.map((video, index) => (
                <a key={index} href={video.url} target="_blank" rel="noopener noreferrer">
                    <div className="relative aspect-[9/16] w-full rounded-lg overflow-hidden shadow-lg bg-muted">
                        <Image src={video.thumbnailUrl || '/placeholder.jpg'} alt={video.title} fill style={{objectFit: 'cover'}}/>
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Video className="h-8 w-8 text-white" />
                        </div>
                         <p className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold truncate text-center bg-black/50 p-1 rounded">
                            {video.title}
                        </p>
                    </div>
                </a>
            ))}
        </div>
    );
};

const FullVideosTab = () => {
    const q = query(collection(firestore, 'motivationVideos'), where('type', '==', 'full_video'), orderBy('createdAt', 'desc'));
    const [videos, loading, error] = useCollectionData(q);

     if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="w-full aspect-video rounded-lg" />
                ))}
            </div>
        )
    }

    if (error) {
        return <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Could not load videos</AlertTitle>
            <AlertDescription className="text-xs">{error.message}</AlertDescription>
        </Alert>
    }

    if (!videos || videos.length === 0) {
        return (
            <div className="text-center text-muted-foreground p-8">
                <Video className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Full Videos</h3>
                <p>Full-length motivational videos will be added here.</p>
            </div>
        );
    }

     return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((video, index) => (
                <a key={index} href={video.url} target="_blank" rel="noopener noreferrer">
                     <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-lg bg-muted">
                        <Image src={video.thumbnailUrl || '/placeholder.jpg'} alt={video.title} fill style={{objectFit: 'cover'}}/>
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Video className="h-12 w-12 text-white" />
                        </div>
                         <p className="absolute bottom-2 left-2 right-2 text-white font-semibold truncate text-center bg-black/50 p-2 rounded">
                            {video.title}
                        </p>
                    </div>
                </a>
            ))}
        </div>
    );
}

const GalleryTab = () => {
    const [images, loading, error] = useCollection(
        query(collection(firestore, 'galleryImages'), orderBy('createdAt', 'desc'))
    );

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="w-full aspect-square rounded-lg" />
                ))}
            </div>
        )
    }
    if (error) {
         return <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Could not load gallery</AlertTitle>
            <AlertDescription className="text-xs">{error.message}</AlertDescription>
        </Alert>
    }
    if (!images || images.empty) {
         return (
             <div className="text-center text-muted-foreground p-8">
                <GalleryHorizontal className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Our Gallery</h3>
                <p>No images have been added yet.</p>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.docs.map(doc => {
                const image = doc.data();
                return (
                    <div key={doc.id} className="relative aspect-square w-full rounded-lg overflow-hidden shadow-lg">
                        <Image src={image.url} alt={image.title || 'Gallery Image'} fill style={{ objectFit: 'cover' }} />
                         {image.title && <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center truncate">{image.title}</p>}
                    </div>
                );
            })}
        </div>
    );
};

export default function MotivationPage() {
    const [currentLine, setCurrentLine] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentLine(prev => (prev + 1) % motivationalLines.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8 p-4 md:p-6">
            <div className="text-center">
                 <Heart className="mx-auto h-12 w-12 text-pink-500 mb-4" />
                <h1 className="text-3xl md:text-4xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-500">
                    Motivation Sphere
                </h1>
                <p className="text-muted-foreground mt-2">Your daily dose of inspiration and positivity.</p>
            </div>
            
            <Card className="overflow-hidden">
                <CardContent className="p-4 text-center bg-muted">
                     <motion.p
                        key={currentLine}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="font-semibold text-lg"
                    >
                        "{motivationalLines[currentLine]}"
                    </motion.p>
                </CardContent>
            </Card>

            <Tabs defaultValue="shorts" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="shorts"><Film className="mr-2" /> Shorts</TabsTrigger>
                    <TabsTrigger value="full_videos"><Video className="mr-2" /> Videos</TabsTrigger>
                    <TabsTrigger value="gallery"><GalleryHorizontal className="mr-2" /> Gallery</TabsTrigger>
                </TabsList>
                <TabsContent value="shorts" className="mt-6">
                    <ShortsTab />
                </TabsContent>
                <TabsContent value="full_videos" className="mt-6">
                    <FullVideosTab />
                </TabsContent>
                <TabsContent value="gallery" className="mt-6">
                    <GalleryTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
