
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
  const [formType, setFormType] = useState<FormType>("signup");

  const { login, signup } = useAuth();
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
  
  const getTitle = () => {
    if (formType === 'signup') return 'Create an Account';
    return 'Sign in to your account';
  };

  return (
    <Card className="w-full max-w-md bg-card shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
          <BookOpenCheck className="h-10 w-10" />
        </div>
        <CardTitle className="text-3xl font-headline text-card-foreground">Go Swami Coaching</CardTitle>
        <CardDescription>{getTitle()}</CardDescription>
      </CardHeader>
      <CardContent>
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
            <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {formType === 'signup' ? 'Sign Up' : 'Sign In'}
            </Button>
        </form>
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
  );
}
