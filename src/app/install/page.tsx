'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { trackPwaInstallAction } from '@/app/actions/pwa';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function InstallPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const appConfigUnsub = onSnapshot(doc(firestore, 'settings', 'appConfig'), (doc) => {
            if (doc.exists()) {
                setAppLogoUrl(doc.data().appLogoUrl || null);
            }
            setLoading(false);
        });

        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setInstallPrompt(event);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if the app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => {
            appConfigUnsub();
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (installPrompt) {
            installPrompt.prompt();
            installPrompt.userChoice.then(async (choiceResult: { outcome: string }) => {
                if (choiceResult.outcome === 'accepted') {
                    toast({ title: 'Installation Successful!', description: "The app has been added to your home screen." });
                    setIsVisible(false);
                    if (user) {
                        await trackPwaInstallAction(user.uid);
                    }
                } else {
                    toast({ title: 'Installation Cancelled', variant: 'destructive' });
                }
            });
        } else {
            toast({ title: 'Installation Not Available', description: 'The installation prompt is not available at the moment. It might be because the app is already installed or your browser doesn\'t support it.', variant: 'destructive' });
        }
    };
    
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

                <Button onClick={handleInstallClick} className="w-full h-12 text-lg font-semibold" disabled={!isVisible}>
                    <Download className="mr-2" />
                    Install App
                </Button>
                
                 <div className="mt-8 text-center">
                    <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
                        Continue to website
                    </Link>
                </div>
            </div>
        </div>
    );
}