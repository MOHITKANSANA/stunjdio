
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoginForm } from "@/components/login-form";
import { BookOpenCheck, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

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
