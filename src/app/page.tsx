
'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Shield } from "lucide-react";
import { onSnapshot, doc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import Image from "next/image";

const AnimatedSplashScreen = () => {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        const unsub = onSnapshot(doc(firestore, 'settings', 'appConfig'), (doc) => {
            if (doc.exists()) {
                setLogoUrl(doc.data().appLogoUrl || null);
            }
        });
        return () => unsub();
    }, []);

    return (
        <div className="splash-container flex flex-col items-center justify-between h-full w-full text-white p-8">
            <div className="text-center w-full splash-item splash-item-1">
                <p className="text-sm text-gray-300">Made with ❤️ in India</p>
            </div>
            <div className="flex flex-col items-center text-center">
                {logoUrl ? (
                    <div className="splash-item splash-item-2 relative h-40 w-40">
                       <Image src={logoUrl} alt="App Logo" fill className="rounded-full object-cover" />
                    </div>
                ) : (
                    <div className="splash-item splash-item-2 font-headline text-8xl font-bold flex items-center">
                        <span className="text-saffron">G</span>
                        <span className="text-green">S</span>
                    </div>
                )}
                
                <h1 className="text-5xl font-bold font-headline text-white mt-4 splash-item splash-item-3 metallic-text">
                    GoSwamiX
                </h1>
                <p className="mt-2 text-lg text-gray-300 splash-item splash-item-4">Your Path to Success Starts Here</p>
            </div>
            <div className="text-center w-full space-y-2">
            <p className="text-sm text-gray-400 splash-item splash-item-5">Live Classes • AI Tests • Personal Mentorship</p>
            <div className="flex justify-center gap-4 text-xs text-gray-500">
                    <span className="splash-item splash-item-6 feature-text-1">UPSC</span>
                    <span className="splash-item splash-item-6">•</span>
                    <span className="splash-item splash-item-7 feature-text-2">SSC</span>
                    <span className="splash-item splash-item-7">•</span>
                    <span className="splash-item splash-item-7 feature-text-3">Defence</span>
            </div>
            </div>
        </div>
    );
};


const LoadingSpinner = () => (
    <div className="flex flex-col items-center gap-4">
        <Shield className="h-12 w-12 animate-pulse text-primary" />
        <p className="text-muted-foreground">Loading your experience...</p>
    </div>
);

export default function WelcomePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isSplashVisible, setIsSplashVisible] = useState(true);

    useEffect(() => {
        const splashContainer = document.querySelector('.splash-container');
        
        const splashTimer = setTimeout(() => {
            splashContainer?.classList.add('fade-out');
            
            const fadeOutTimer = setTimeout(() => {
                setIsSplashVisible(false);
            }, 500); 

            return () => clearTimeout(fadeOutTimer);
        }, 3500); 

        return () => clearTimeout(splashTimer);
    }, []);


    useEffect(() => {
        if (isSplashVisible || authLoading) return;

        if (user) {
            router.replace('/dashboard');
        } else {
            router.replace('/login');
        }
    }, [user, authLoading, router, isSplashVisible]);

    return (
        <div className="h-screen w-screen bg-background">
             {isSplashVisible ? (
                <AnimatedSplashScreen />
             ) : (
                <div className="flex min-h-screen w-full items-center justify-center">
                    <LoadingSpinner />
                </div>
             )}
        </div>
    );
}
