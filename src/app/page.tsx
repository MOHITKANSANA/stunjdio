

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { BookOpenCheck } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import Image from "next/image";

const LoadingSpinner = () => (
    <div className="flex flex-col items-center gap-4">
        <BookOpenCheck className="h-12 w-12 animate-pulse text-primary" />
        <p className="text-muted-foreground">Loading your experience...</p>
    </div>
);

export default function WelcomePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [splashScreenUrl, setSplashScreenUrl] = useState<string | null>(null);
    const [showSplash, setShowSplash] = useState(true);
    const [fetchingSplash, setFetchingSplash] = useState(true);

    useEffect(() => {
        const fetchSplashScreen = async () => {
            try {
                const settingsDoc = await getDoc(doc(firestore, 'settings', 'splashScreen'));
                if (settingsDoc.exists()) {
                    setSplashScreenUrl(settingsDoc.data().url);
                }
            } catch (error) {
                console.error("Error fetching splash screen:", error);
            } finally {
                setFetchingSplash(false);
            }
        };
        fetchSplashScreen();
    }, []);

    useEffect(() => {
        // If there's no splash screen URL, don't wait.
        if (fetchingSplash) return;
        if (!splashScreenUrl) {
            setShowSplash(false);
            return;
        }

        const splashTimer = setTimeout(() => {
            setShowSplash(false);
        }, 5000); // 5-second splash screen

        return () => clearTimeout(splashTimer);
    }, [splashScreenUrl, fetchingSplash]);


    useEffect(() => {
        if (showSplash || authLoading || fetchingSplash) return;

        if (user) {
            router.replace('/dashboard');
        } else {
            router.replace('/login');
        }
    }, [user, authLoading, router, showSplash, fetchingSplash]);

    if (showSplash && splashScreenUrl) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <Image src={splashScreenUrl} alt="Loading..." fill style={{ objectFit: 'cover' }} priority />
            </div>
        );
    }
    
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <LoadingSpinner />
        </div>
    );
}
