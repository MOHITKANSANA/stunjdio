'use client';

import { useState, useEffect } from 'react';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { doc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Youtube, Facebook, Instagram, Twitter, Linkedin, Link as LinkIcon, Users, MessageCircle } from 'lucide-react';
import NextImage from 'next/image';

const hardcodedLinks = [
    {
        name: 'YouTube Channel',
        url: 'https://youtube.com/@learnwithmunendra?si=2rDXT8uyY1aLieOC',
        iconName: 'youtube'
    },
    {
        name: 'Instagram Profile',
        url: 'https://www.instagram.com/munendra_yadav_etah?igsh=a3RhNzNtZTdlNXNs',
        iconName: 'instagram'
    },
    {
        name: 'WhatsApp Channel',
        url: 'https://whatsapp.com/channel/0029Vb6oq5tHgZWbg5Qiju0D',
        iconName: 'whatsapp'
    },
     {
        name: 'Facebook Page',
        url: 'https://www.facebook.com/share/17FaLyq3GL/',
        iconName: 'facebook'
    },
    {
        name: 'Demo Video',
        url: 'https://youtu.be/gc-vml3wVDY?si=0Dk2JutYsmBs7BqW',
        iconName: 'youtube'
    }
]

const SocialIcon = ({ iconName, iconUrl }: { iconName?: string, iconUrl?: string }) => {
    switch (iconName) {
        case 'youtube': return <Youtube className="h-8 w-8 text-red-600" />;
        case 'facebook': return <Facebook className="h-8 w-8 text-blue-600" />;
        case 'instagram': return <Instagram className="h-8 w-8 text-pink-600" />;
        case 'twitter': return <Twitter className="h-8 w-8 text-sky-500" />;
        case 'linkedin': return <Linkedin className="h-8 w-8 text-blue-700" />;
        case 'whatsapp': return <MessageCircle className="h-8 w-8 text-green-500" />;
        default:
            if (iconUrl) {
                return <NextImage src={iconUrl} alt="social icon" width={32} height={32} className="rounded-full h-8 w-8"/>;
            }
            return <LinkIcon className="h-8 w-8" />;
    }
}

export default function SocialMediaPage() {
    const [socialLinksDoc, loading] = useDocumentData(doc(firestore, 'settings', 'appConfig'));
    const [allLinks, setAllLinks] = useState(hardcodedLinks);

    useEffect(() => {
        if (socialLinksDoc?.socialMediaLinks) {
            // Combine hardcoded and Firestore links, avoiding duplicates by URL
            const firestoreLinks = socialLinksDoc.socialMediaLinks.filter(
                (dbLink: any) => !hardcodedLinks.some(hl => hl.url === dbLink.url)
            );
            setAllLinks([...hardcodedLinks, ...firestoreLinks]);
        }
    }, [socialLinksDoc]);

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4">
             <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-primary" />
                <h1 className="text-3xl md:text-4xl font-bold font-headline mt-4">Join Our Community</h1>
                <p className="text-muted-foreground mt-2">Connect with us on social media for the latest updates, tips, and discussions.</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {allLinks.map((link, index) => (
                        <a href={link.url} target="_blank" rel="noopener noreferrer" key={index} className="block">
                            <Card className="hover:bg-muted hover:shadow-lg transition-all duration-200 h-full">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="flex-shrink-0">
                                        <SocialIcon iconName={link.iconName} iconUrl={(link as any).icon} />
                                    </div>
                                    <p className="font-semibold text-base">{link.name}</p>
                                </CardContent>
                            </Card>
                        </a>
                    ))}
                </div>
            )}
        </div>
    )
}
