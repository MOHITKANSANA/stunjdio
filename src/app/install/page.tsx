
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
            <div className="w-full max-w-sm mx-auto text-center">
                 <div className="relative inline-block mb-6">
                    {appLogoUrl ? (
                         <Image src={appLogoUrl} alt="App Logo" width={128} height={128} className="rounded-3xl shadow-lg" priority />
                    ) : (
                         <div className="h-32 w-32 rounded-3xl bg-primary/20 flex items-center justify-center shadow-lg">
                            <span className="text-6xl font-bold text-primary">L</span>
                         </div>
                    )}
                </div>

                <h1 className="text-3xl font-bold">Learn with Munedra</h1>
                <p className="text-muted-foreground text-md mt-1">Your learning companion</p>
                
                <div className="mt-10">
                   <InstallPwaPrompt />
                </div>
                
                 <div className="mt-8">
                    <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
                        Continue to website without installing
                    </Link>
                </div>
            </div>
        </div>
    );
}
