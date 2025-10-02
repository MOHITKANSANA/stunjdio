

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { BookOpenCheck } from "lucide-react";

const AnimatedSplashScreen = () => (
    <div className="splash-container flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-orange-400 via-white to-green-500 text-white p-8">
        <div className="splash-logo">
            <BookOpenCheck className="h-24 w-24 text-slate-800" />
        </div>
        <h1 className="text-5xl font-bold font-headline text-slate-900 mt-6 splash-name">
            Go Swami X
        </h1>
        <p className="mt-2 text-lg text-slate-700 splash-tagline">The Future of Learning</p>
    </div>
);


const LoadingSpinner = () => (
    <div className="flex flex-col items-center gap-4">
        <BookOpenCheck className="h-12 w-12 animate-pulse text-primary" />
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
        }, 2500); 

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
