
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Film, GalleryHorizontal } from 'lucide-react';
import Image from 'next/image';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

const motivationalLines = [
    "विश्वास करो कि तुम कर सकते हो और तुम आधा रास्ता तय कर चुके हो।",
    "महान कार्य करने का एकमात्र तरीका यह है कि आप जो करते हैं उससे प्यार करें।",
    "सफलता खुशी की कुंजी नहीं है। खुशी सफलता की कुंजी है।",
    "घड़ी मत देखो; वह करो जो वह करती है। चलते रहो।",
    "भविष्य उनका है जो अपने सपनों की सुंदरता में विश्वास करते हैं।"
];

const ShortsTab = () => {
    // This would fetch short video data from Firestore in a real app
    const shortVideos = [
        { id: 1, url: 'https://youtube.com/shorts/your_short_id_1' },
        { id: 2, url: 'https://youtube.com/shorts/your_short_id_2' },
        { id: 3, url: 'https://youtube.com/shorts/your_short_id_3' },
    ];

    return (
        <div className="text-center text-muted-foreground p-8">
            <Film className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Motivational Shorts</h3>
            <p>This feature is coming soon!</p>
        </div>
    );
};

const GalleryTab = () => {
    const [images, loading, error] = useCollection(
        query(collection(firestore, 'galleryImages'), orderBy('createdAt', 'desc'))
    );

    return (
        <div>
            {loading && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="w-full aspect-square rounded-lg" />
                    ))}
                </div>
            )}
            {error && <p className="text-destructive text-center">Could not load gallery images.</p>}
            {!loading && images && images.empty && (
                 <div className="text-center text-muted-foreground p-8">
                    <GalleryHorizontal className="h-16 w-16 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">Our Gallery</h3>
                    <p>No images have been added yet.</p>
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images?.docs.map(doc => {
                    const image = doc.data();
                    return (
                        <div key={doc.id} className="relative aspect-square w-full rounded-lg overflow-hidden shadow-lg">
                            <Image src={image.url} alt={image.title || 'Gallery Image'} fill style={{ objectFit: 'cover' }} />
                        </div>
                    );
                })}
            </div>
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
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="shorts"><Film className="mr-2" /> Shorts</TabsTrigger>
                    <TabsTrigger value="gallery"><GalleryHorizontal className="mr-2" /> Our Gallery</TabsTrigger>
                </TabsList>
                <TabsContent value="shorts" className="mt-6">
                    <ShortsTab />
                </TabsContent>
                <TabsContent value="gallery" className="mt-6">
                    <GalleryTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
