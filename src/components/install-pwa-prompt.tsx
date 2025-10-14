
'use client';

import { useEffect, useState, useCallback } from 'react';
import { trackPwaInstallAction } from '@/app/actions/pwa';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
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
            if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
                setIsAppInstalled(true);
            }
        };

        checkInstalled();
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', () => {
            setIsAppInstalled(true);
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
                    description: 'Your browser may not support PWA installation. Please try using Chrome on Android or Safari on iOS.',
                    variant: 'destructive',
                });
            }
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            toast({ title: 'Installation Successful!', description: 'The app has been added to your home screen.' });
            // Tracking can be done without a user ID if needed, or passed as a prop if available
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
