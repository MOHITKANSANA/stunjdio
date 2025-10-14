
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import Link from 'next/link';
import { InstallPwaPrompt } from '@/components/install-pwa-prompt';

export default function InstallPage() {
    const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const appConfigUnsub = onSnapshot(doc(firestore, 'settings', 'appConfig'), (doc) => {
            if (doc.exists()) {
                setAppLogoUrl(doc.data().appLogoUrl || null);
            }
            setLoading(false);
        });

        return () => {
            appConfigUnsub();
        };
    }, []);

    if (loading) {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    {appLogoUrl ? (
                         <Image src={appLogoUrl} alt="App Logo" width={80} height={80} className="rounded-2xl shadow-md" />
                    ) : (
                        <div className="h-20 w-20 rounded-2xl bg-primary/20 flex items-center justify-center shadow-md">
                            <span className="text-4xl font-bold text-primary">L</span>
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold">Learn with Munedra</h1>
                        <p className="text-muted-foreground text-sm">Go Swami Coaching Classes</p>
                        <div className="flex items-center gap-2 mt-1">
                             <Image src="https://i.postimg.cc/RVT2b2HL/google-play-logo.png" alt="Google Play" width={100} height={25} />
                        </div>
                    </div>
                </div>

                <InstallPwaPrompt />
                
                 <div className="mt-8 text-center">
                    <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
                        Continue to website
                    </Link>
                </div>
            </div>
        </div>
    );
}
