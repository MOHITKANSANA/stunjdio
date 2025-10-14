
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { trackPwaInstallAction } from '@/app/actions/pwa';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

let deferredPrompt: any = null;

export const InstallPwaPrompt = () => {
    const { user } = useAuth();
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
                title: 'Installation Not Available',
                description: 'Your browser may not support PWA installation, or the app might already be installed.',
                variant: 'destructive',
            });
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            toast({ title: 'Installation Successful!', description: 'The app has been added to your home screen.' });
            if (user) {
                await trackPwaInstallAction(user.uid);
            }
        } else {
            toast({ title: 'Installation Cancelled' });
        }

        deferredPrompt = null;
        setIsInstallable(false);
    }, [toast, user]);
    
    // Always render the button. The click handler will inform the user if it's not possible.
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
