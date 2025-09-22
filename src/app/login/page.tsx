
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoginForm } from "@/components/login-form";
import { BookOpenCheck, Loader2 } from "lucide-react";
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (loading) {
        return;
    }

    if (user) {
        const checkProfile = async () => {
            const userDocRef = doc(firestore, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists() && docSnap.data().ageGroup) {
                router.replace('/dashboard');
            } else {
                router.replace('/dashboard/complete-profile');
            }
        };
        checkProfile();
    } else {
        setCheckingProfile(false);
    }
  }, [user, loading, router]);

  if (loading || checkingProfile) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <BookOpenCheck className="h-12 w-12 animate-pulse text-primary" />
            <p className="text-muted-foreground">Loading your experience...</p>
        </div>
      </div>
    );
  }
  
  return <LoginForm />;
}
