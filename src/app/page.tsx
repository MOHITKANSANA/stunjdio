
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
    const [isFading, setIsFading] = useState(false);
    const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        const appConfigUnsub = onSnapshot(doc(firestore, 'settings', 'appConfig'), (doc) => {
            if (doc.exists()) {
                setAppLogoUrl(doc.data().appLogoUrl || null);
            }
        });

        const redirectTimer = setTimeout(() => {
            setIsFading(true);
        }, 2500);

        const navigationTimer = setTimeout(() => {
            if (!authLoading) {
                if (user) {
                    router.replace('/dashboard');
                } else {
                    router.replace('/login');
                }
            }
        }, 3000); // Wait for fade-out animation

        return () => {
            appConfigUnsub();
            clearTimeout(redirectTimer);
            clearTimeout(navigationTimer);
        };
    }, [user, authLoading, router]);

    return (
        <div className={cn("splash-container h-screen w-screen flex flex-col items-center justify-center transition-opacity duration-500", isFading && "opacity-0")}>
            <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                 <div className="relative inline-block splash-item splash-item-1">
                    {appLogoUrl ? (
                         <Image src={appLogoUrl} alt="App Logo" width={180} height={180} className="h-44 w-44 rounded-full shadow-lg" priority />
                    ) : (
                         <div className="h-44 w-44 rounded-full bg-primary/20 flex items-center justify-center shadow-lg">
                            <span className="text-6xl font-bold text-primary">L</span>
                         </div>
                    )}
                </div>

                <h1 className="splash-item splash-item-2 text-4xl md:text-5xl font-bold font-headline mt-6 metallic-text">Learn with Munedra</h1>
                 <p className="splash-item splash-item-2 text-lg text-muted-foreground mt-2">Learn. Practice. Succeed.</p>
                
            </div>
             <div className="w-full text-center pb-8 splash-item splash-item-3">
                 <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    UPSC • SSC • NDA • Sainik School
                 </p>
                 <p className="text-sm text-muted-foreground mt-2">Mobile: +91 9327175729</p>
                 <p className="text-xs font-medium text-muted-foreground/80 mt-4">
                    Made with ❤️ in India
                 </p>
            </div>
        </div>
    );
}
