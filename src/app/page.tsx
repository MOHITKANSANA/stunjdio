

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { BookOpenCheck } from "lucide-react";

const AnimatedSplashScreen = () => (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-primary to-blue-700 text-white p-8">
        <div className="splash-logo">
            <BookOpenCheck className="h-20 w-20" />
        </div>
        <h1 className="text-4xl font-bold font-headline mt-6 splash-name">Go Swami X</h1>
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
        const splashTimer = setTimeout(() => {
            const splashContainer = document.querySelector('.splash-container');
            splashContainer?.classList.add('fade-out');
            
            const fadeOutTimer = setTimeout(() => {
                setIsSplashVisible(false);
            }, 500); // Corresponds to the fade-out animation duration

            return () => clearTimeout(fadeOutTimer);
        }, 2000); // Total splash screen duration before starting to fade

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
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
             {isSplashVisible ? (
                <div className="splash-container h-full w-full">
                    <AnimatedSplashScreen />
                </div>
             ) : (
                <LoadingSpinner />
             )}
        </div>
    );
}
