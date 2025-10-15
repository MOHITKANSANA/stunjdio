
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
    
    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            deferredPrompt = event;
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = useCallback(async () => {
        if (!deferredPrompt) {
            toast({
                variant: "destructive",
                title: "Installation Not Available",
                description: "The app cannot be installed at the moment. Please try again later or use a supported browser.",
            });
            return;
        }

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                toast({ title: 'Installation Successful!', description: 'The app has been added to your home screen.' });
            }

            deferredPrompt = null;
            setIsInstallable(false);
        } catch (error) {
            console.error('Error during PWA installation:', error);
            toast({
                variant: "destructive",
                title: "Installation Failed",
                description: "There was an error trying to install the app.",
            });
        }
    }, [toast]);
    
    if (!isInstallable) {
        return null;
    }
    
    return (
        <div className="w-full space-y-4">
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
