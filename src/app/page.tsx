
'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Shield, BookOpenCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WelcomePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        const redirectTimer = setTimeout(() => {
            setIsFading(true);
        }, 3500);

        const navigationTimer = setTimeout(() => {
            if (!authLoading) {
                if (user) {
                    router.replace('/dashboard');
                } else {
                    router.replace('/login');
                }
            }
        }, 4000); // Wait for fade-out animation

        return () => {
            clearTimeout(redirectTimer);
            clearTimeout(navigationTimer);
        };
    }, [user, authLoading, router]);

    return (
        <div className={cn("splash-container h-screen w-screen flex items-center justify-center transition-opacity duration-500", isFading && "opacity-0")}>
            <div className="text-center">
                <div className="relative inline-block">
                    <BookOpenCheck className="splash-item splash-item-1 h-24 w-24 text-primary animate-pulse" />
                </div>
                <h1 className="splash-item splash-item-2 text-4xl md:text-5xl font-bold font-headline mt-4 metallic-text">Go Swami X</h1>
                <div className="splash-item splash-item-3 mt-8 flex justify-center items-baseline gap-2 font-body text-lg">
                    <span className="feature-text-1">Learn.</span>
                    <span className="feature-text-2">Practice.</span>
                    <span className="feature-text-3">Succeed.</span>
                </div>
            </div>
        </div>
    );
}
