
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { trackPwaInstallAction } from '@/app/actions/pwa';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, CheckCircle, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Store the event in a global variable to ensure it's not missed
let deferredPrompt: any = null;

export const InstallPwaPrompt = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isAppInstalled, setIsAppInstalled] = useState(false);

    const checkInstallationStatus = useCallback(() => {
        // Check if the app is running in standalone mode (i.e., installed)
        if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
            setIsAppInstalled(true);
        }
    }, []);

    useEffect(() => {
        checkInstallationStatus();

        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            deferredPrompt = event;
            // Update state to show the button if it wasn't already available
            if (!installPrompt) {
                setInstallPrompt(event);
            }
        };

        // If the event has already been fired, use the stored prompt
        if (deferredPrompt) {
            setInstallPrompt(deferredPrompt);
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for when the app is installed
        window.addEventListener('appinstalled', () => {
            setIsAppInstalled(true);
            setInstallPrompt(null);
            deferredPrompt = null;
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [installPrompt, checkInstallationStatus]);

    const handleInstallClick = useCallback(async () => {
        if (!installPrompt) {
            toast({
                title: 'Installation Not Available',
                description: 'The app may already be installed, or your browser may not support PWA installation.',
                variant: 'destructive',
            });
            return;
        }

        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;

        if (outcome === 'accepted') {
            toast({ title: 'Installation Successful!', description: 'The app has been added to your home screen.' });
            setIsAppInstalled(true);
            if (user) {
                await trackPwaInstallAction(user.uid);
            }
        } else {
            toast({ title: 'Installation Cancelled' });
        }

        setInstallPrompt(null);
        deferredPrompt = null;
    }, [installPrompt, toast, user]);

    if (isAppInstalled) {
        return (
            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg">
                <CardContent className="p-4 flex items-center justify-center gap-3">
                    <CheckCircle className="h-8 w-8" />
                    <div>
                        <h3 className="font-bold">App is already installed!</h3>
                        <p className="text-sm opacity-90">Open it from your home screen for the best experience.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    if (installPrompt) {
        return (
            <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                      <Smartphone className="h-8 w-8" />
                      <div>
                          <h3 className="font-bold">Install the Learn with Munedra App</h3>
                          <p className="text-sm opacity-90">Get a faster, offline-ready experience.</p>
                      </div>
                  </div>
                  <Button onClick={handleInstallClick} className="bg-white text-purple-600 hover:bg-gray-100 shrink-0">
                      <Download className="mr-2 h-4 w-4" />
                      Install App
                  </Button>
              </CardContent>
            </Card>
        );
    }

    return null;
}
