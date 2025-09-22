
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

  useEffect(() => {
    if (user) {
        router.replace('/dashboard');
    }
  }, [user, router]);

  if (loading || user) {
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
