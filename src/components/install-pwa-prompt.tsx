
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

let deferredPrompt: any = null;

export const InstallPwaPrompt = () => {
    const { toast } = useToast();
    const [isInstallable, setIsInstallable] = useState(false);
    const [isAppInstalled, setIsAppInstalled] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            deferredPrompt = event;
            setIsInstallable(true);
        };

        const checkInstalled = () => {
            if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
                setIsAppInstalled(true);
            }
        };

        checkInstalled();
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', () => {
            setIsAppInstalled(true);
            setIsInstallable(false);
            deferredPrompt = null;
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = useCallback(async () => {
        if (!deferredPrompt) {
             if (isAppInstalled) {
                 toast({
                    title: 'App Already Installed',
                    description: 'You can open the app from your home screen.',
                });
            } else {
                 toast({
                    title: 'Installation Not Available',
                    description: 'Your browser may not support PWA installation, or the prompt is not ready. Please try again or use a supported browser like Chrome on Android or Safari on iOS.',
                    variant: 'destructive',
                });
            }
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            toast({ title: 'Installation Successful!', description: 'The app has been added to your home screen.' });
        } else {
            toast({ title: 'Installation Cancelled' });
        }

        deferredPrompt = null;
        setIsInstallable(false);
    }, [toast, isAppInstalled]);
    
    if (isAppInstalled) {
        return (
            <p className="text-center text-muted-foreground mt-8">
                App is already installed. Open it from your home screen.
            </p>
        );
    }
    
    return (
        <Button 
            onClick={handleInstallClick} 
            size="lg"
            className="w-full text-lg h-14 bg-gradient-to-r from-blue-500 to-sky-500 text-white shadow-lg animate-pulse hover:animate-none"
        >
            <Download className="mr-3" />
            Install App
        </Button>
    );
}
