
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { trackPwaInstallAction } from '@/app/actions/pwa';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const InstallPwaPrompt = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isAppInstalled, setIsAppInstalled] = useState(false);

    useEffect(() => {
        // Check if the app is running in standalone mode (i.e., installed)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsAppInstalled(true);
        }

        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setInstallPrompt(event);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        }
    }, []);

    const handleInstallClick = () => {
        if (!installPrompt) {
            toast({
                title: 'Installation Not Available',
                description: 'The app may already be installed, or your browser may not support PWA installation.',
                variant: 'destructive',
            });
            return;
        }

        installPrompt.prompt();
        installPrompt.userChoice.then(async (choiceResult: { outcome: string }) => {
            if (choiceResult.outcome === 'accepted') {
                toast({ title: 'Installation Successful!', description: 'The app has been added to your home screen.' });
                setIsAppInstalled(true); // Assume installation is successful
                if (user) {
                    await trackPwaInstallAction(user.uid);
                }
            } else {
                toast({ title: 'Installation Cancelled' });
            }
        });
    };

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
                      <Download className="h-8 w-8" />
                      <div>
                          <h3 className="font-bold">Install the Learn with Munedra App</h3>
                          <p className="text-sm opacity-90">For a better, faster, and offline-ready experience.</p>
                      </div>
                  </div>
                  <Button onClick={handleInstallClick} className="bg-white text-purple-600 hover:bg-gray-100 shrink-0">Install Now</Button>
              </CardContent>
          </Card>
        );
    }

    return null;
}
