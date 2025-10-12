
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpenCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { UserCredential } from "firebase/auth";

type FormType = "signup" | "login";

const schema = z.object({
    email: z.string().email({ message: "Invalid email address." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." })
});

type LoginFormValues = z.infer<typeof schema>;


export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formType, setFormType] = useState<FormType>("signup");

  const { login, signup, googleLogin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  useEffect(() => {
    form.reset();
  }, [formType, form]);


  const handleSuccess = (userCredential: UserCredential, type: string) => {
    toast({ title: `${type} successful!` });
    const isNewUser = userCredential.operationType === 'signIn' && userCredential.user.metadata.creationTime === userCredential.user.metadata.lastSignInTime;
    
    if (isNewUser || !userCredential.user.displayName) {
        router.push("/dashboard/complete-profile");
    } else {
        router.push("/dashboard");
    }
  }

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
        let userCredential;
        if (formType === 'login') {
            userCredential = await login(data.email, data.password);
            handleSuccess(userCredential, "Login");
        } else {
            userCredential = await signup(data.email, data.password);
            handleSuccess(userCredential, "Signup");
        }
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
        const userCredential = await googleLogin();
        handleSuccess(userCredential, "Login");
    } catch (error: any) {
         toast({
            title: "Google Sign-In Failed",
            description: error.code === 'auth/popup-closed-by-user' ? 'Sign-in cancelled.' : error.message,
            variant: "destructive",
        });
    } finally {
        setIsGoogleLoading(false);
    }
  };
  
  const getTitle = () => {
    if (formType === 'signup') return 'Create an Account';
    return 'Sign in to your account';
  };
  
  const getButtonText = () => {
    if (formType === 'signup') return 'Sign Up';
    return 'Sign In';
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md bg-card shadow-lg">
            <CardHeader className="text-center">
                <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
                <BookOpenCheck className="h-10 w-10" />
                </div>
                <CardTitle className="text-3xl font-headline text-card-foreground">Learn with Munedra</CardTitle>
                <CardDescription>{getTitle()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="student@example.com" {...form.register("email")} />
                    {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" {...form.register("password")} />
                    {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {getButtonText()}
                    </Button>
                </form>
                 <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>
                 <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                    {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.3 512 0 400.7 0 264.1 0 127.6 111.3 16 244 16c68.3 0 128.3 27.6 171.8 71.4l-64.5 64.5C314.2 112.5 281.4 96 244 96c-85.6 0-154.5 68.9-154.5 154.5S158.4 405 244 405c93.1 0 134.3-71.3 137.9-108.3H244v-87.1h244c2.5 13.1 3.9 26.6 3.9 40.8z"></path></svg>}
                    Sign in with Google
                </Button>

            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <div className="text-center text-sm">
                    {formType === 'signup' ? (
                       <>
                         Already have an account?{" "}
                         <Button variant="link" className="p-0 h-auto" onClick={() => setFormType('login')}>Sign in</Button>
                       </>
                    ) : (
                       <>
                         Don't have an account?{" "}
                         <Button variant="link" className="p-0 h-auto" onClick={() => setFormType('signup')}>Sign up</Button>
                       </>
                    )}
                </div>
            </CardFooter>
        </Card>
    </div>
  );
}
