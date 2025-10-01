

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { BookOpenCheck } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import Image from "next/image";

const DefaultSplashScreen = ({ userName }: { userName: string | null | undefined }) => (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-primary to-blue-700 text-white p-8">
        <BookOpenCheck className="h-20 w-20 mb-6 animate-pulse" />
        <h1 className="text-4xl font-bold font-headline">Go Swami Coaching</h1>
        {userName && <p className="text-2xl mt-4">Hello, {userName}</p>}
        <p className="mt-2 text-lg text-white/80">Loading your experience...</p>
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
    const [splashScreenUrl, setSplashScreenUrl] = useState<string | null>(null);
    const [showSplash, setShowSplash] = useState(true);
    const [fetchingSplash, setFetchingSplash] = useState(true);

    useEffect(() => {
        const fetchSplashScreen = async () => {
            try {
                const settingsDoc = await getDoc(doc(firestore, 'settings', 'splashScreen'));
                if (settingsDoc.exists() && settingsDoc.data().url) {
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
        if (fetchingSplash) return;

        const splashTimer = setTimeout(() => {
            setShowSplash(false);
        }, 5000); 

        return () => clearTimeout(splashTimer);
    }, [fetchingSplash]);


    useEffect(() => {
        if (showSplash || authLoading || fetchingSplash) return;

        if (user) {
            router.replace('/dashboard');
        } else {
            router.replace('/login');
        }
    }, [user, authLoading, router, showSplash, fetchingSplash]);

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
             {showSplash ? (
                splashScreenUrl ? (
                    <Image src={splashScreenUrl} alt="Loading..." fill style={{ objectFit: 'cover' }} priority />
                ) : (
                    <DefaultSplashScreen userName={user?.displayName} />
                )
             ) : (
                <LoadingSpinner />
             )}
        </div>
    );
}
