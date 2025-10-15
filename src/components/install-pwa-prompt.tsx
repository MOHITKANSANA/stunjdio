
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle } from 'lucide-react';

let deferredPrompt: any = null;

export const InstallPwaPrompt = () => {
    const { toast } = useToast();
    const [isInstallable, setIsInstallable] = useState(false);
    const [showError, setShowError] = useState(false);
    const [isAppInstalled, setIsAppInstalled] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            deferredPrompt = event;
            setIsInstallable(true);
            setShowError(false); // Hide error if prompt becomes available
        };

        const checkInstalledStatus = () => {
             // For standalone PWAs
            if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
                setIsAppInstalled(true);
                return;
            }
            // For iOS
            if (typeof window !== 'undefined' && (window.navigator as any).standalone) {
                 setIsAppInstalled(true);
                 return;
            }
        };

        checkInstalledStatus();
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', () => {
             setIsAppInstalled(true);
             deferredPrompt = null;
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = useCallback(async () => {
        setShowError(false);

        if (isAppInstalled) {
            toast({ title: "App is already installed!", description: "You can open it from your home screen." });
            return;
        }

        if (!deferredPrompt) {
            console.warn('PWA install prompt not available.');
            setShowError(true);
            return;
        }

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                toast({ title: 'Installation Successful!', description: 'The app has been added to your home screen.' });
            } else {
                toast({ title: 'Installation Cancelled' });
            }

            deferredPrompt = null;
            setIsInstallable(false);
        } catch (error) {
            console.error('Error during PWA installation:', error);
            setShowError(true);
        }
    }, [toast, isAppInstalled]);
    
    if (isAppInstalled) {
        return null;
    }
    
    return (
        <div className="w-full space-y-4">
            {showError && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Installation Not Available</AlertTitle>
                    <AlertDescription>
                       Your browser may not support PWA installation, or the prompt is not ready. Please try again or use a supported browser like Chrome on Android or Safari on iOS.
                    </AlertDescription>
                </Alert>
            )}
             <Button 
                onClick={handleInstallClick} 
                size="lg"
                className="w-full text-lg h-14 bg-gradient-to-r from-blue-500 to-sky-500 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
            >
                <Download className="mr-3" />
                Install App
            </Button>
        </div>
    );
}
