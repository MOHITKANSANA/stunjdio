
'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

export default function WelcomePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stage, setStage] = useState(0); // 0: M2, 1: Logo, 2: Fading out
    const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        const appConfigUnsub = onSnapshot(doc(firestore, 'settings', 'appConfig'), (doc) => {
            if (doc.exists()) {
                setAppLogoUrl(doc.data().appLogoUrl || null);
            }
        });

        const timer1 = setTimeout(() => setStage(1), 1500); // Show M2 for 1.5s
        const timer2 = setTimeout(() => setStage(2), 3000); // Show Logo for 1.5s
        
        const navigationTimer = setTimeout(() => {
            if (!authLoading) {
                if (user) {
                    router.replace('/dashboard');
                } else {
                    router.replace('/login');
                }
            }
        }, 3500); // Start navigation after all animations

        return () => {
            appConfigUnsub();
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(navigationTimer);
        };
    }, [user, authLoading, router]);

    return (
        <div className={cn(
            "splash-container h-screen w-screen flex flex-col items-center justify-center transition-opacity duration-500",
            stage === 2 && "opacity-0"
        )}>
            <div className="flex-grow flex flex-col items-center justify-center text-center p-4 relative w-full h-full">
                {/* M² Logo with Tricolor Background */}
                <div className={cn(
                    "absolute inset-0 flex items-center justify-center transition-opacity duration-700",
                    stage === 0 ? "opacity-100" : "opacity-0"
                )}>
                    <div className="relative flex items-center justify-center w-44 h-44">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500 via-white to-green-600 blur-xl"></div>
                        <h1 className="relative text-8xl font-bold text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}>
                            M²
                        </h1>
                    </div>
                </div>

                {/* App Logo */}
                <div className={cn(
                    "absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-700",
                    stage === 1 ? "opacity-100" : "opacity-0 pointer-events-none"
                )}>
                    <div className="relative inline-block">
                        {appLogoUrl ? (
                            <Image src={appLogoUrl} alt="App Logo" width={180} height={180} className="h-44 w-44 rounded-full shadow-lg" priority />
                        ) : (
                            <div className="h-44 w-44 rounded-full bg-primary/20 flex items-center justify-center shadow-lg">
                                <span className="text-6xl font-bold text-primary">L</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
             <div className={cn(
                "w-full text-center pb-8 transition-opacity duration-500",
                 stage < 2 ? 'opacity-100' : 'opacity-0'
             )}>
                 <h1 className="text-3xl md:text-4xl font-bold font-headline metallic-text">Learn with Munedra</h1>
                 <p className="text-md text-muted-foreground mt-1">Learn. Practice. Succeed.</p>
            </div>
        </div>
    );
}
