
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
import type { ConfirmationResult, RecaptchaVerifier, UserCredential } from "firebase/auth";

type FormType = "login" | "signup" | "phone";

const getValidationSchema = (formType: FormType, showOtp: boolean) => {
    if (formType === 'phone') {
        if (showOtp) {
            return z.object({
                phone: z.string(), // Keep phone in schema for context
                otp: z.string().length(6, { message: "OTP must be 6 digits." })
            });
        }
        return z.object({
            phone: z.string().regex(/^\+[1-9]\d{1,14}$/, { message: "Invalid phone number (e.g., +919876543210)." })
        });
    }
    return z.object({
        email: z.string().email({ message: "Invalid email address." }),
        password: z.string().min(6, { message: "Password must be at least 6 characters." })
    });
};

type LoginFormValues = z.infer<ReturnType<typeof getValidationSchema>>;


export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formType, setFormType] = useState<FormType>("login");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);

  const { login, signup, googleLogin, sendOtp, verifyOtp, setupRecaptcha } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(getValidationSchema(formType, showOtpInput)),
    defaultValues: {
      email: "",
      password: "",
      phone: "",
      otp: "",
    },
  });

  useEffect(() => {
    form.reset();
    setShowOtpInput(false);
    setConfirmationResult(null);
  }, [formType, form]);
  
  useEffect(() => {
    const newResolver = zodResolver(getValidationSchema(formType, showOtpInput));
    // @ts-ignore
    form.resolver = newResolver;
  }, [showOtpInput, formType, form]);
  
  useEffect(() => {
    if (formType === 'phone') {
      setupRecaptcha('recaptcha-container');
    }
  }, [formType, setupRecaptcha]);


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
      if (formType === 'phone') {
        // @ts-ignore
        if (showOtpInput && confirmationResult && data.otp) {
          // @ts-ignore
          const userCredential = await verifyOtp(confirmationResult, data.otp);
          handleSuccess(userCredential, "Phone login");
        } else {
          // @ts-ignore
          const verifier = window.recaptchaVerifier;
          // @ts-ignore
          const result = await sendOtp(data.phone, verifier);
          setConfirmationResult(result);
          setShowOtpInput(true);
          toast({ title: "OTP Sent", description: "Please check your phone for the OTP." });
        }
      } else {
        // @ts-ignore
        if (data.email && data.password) {
            let userCredential;
            if (formType === 'login') {
                // @ts-ignore
                userCredential = await login(data.email, data.password);
                handleSuccess(userCredential, "Login");
            } else {
                // @ts-ignore
                userCredential = await signup(data.email, data.password);
                handleSuccess(userCredential, "Signup");
            }
        }
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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const userCredential = await googleLogin();
      handleSuccess(userCredential, "Google login");
    } catch (error: any) {
      toast({
        title: "Google Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormContent = () => {
    if (formType === 'phone') {
      return (
        <>
          {!showOtpInput ? (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+919876543210"
                {...form.register("phone")}
              />
              {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                {...form.register("otp")}
              />
              {form.formState.errors.otp && <p className="text-xs text-destructive">{form.formState.errors.otp.message}</p>}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {showOtpInput ? 'Verify OTP' : 'Send OTP'}
          </Button>
        </>
      );
    }
    return (
      <>
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
          {formType === 'login' ? 'Sign In' : 'Sign Up'}
        </Button>
      </>
    );
  };
  
  const getTitle = () => {
    if (formType === 'phone') return 'Sign in with Phone';
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
          {renderFormContent()}
        </form>
        <div id="recaptcha-container" className="mt-4"></div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 76.2C322.3 103.2 289.4 86.6 248 86.6c-94.2 0-170.8 76.6-170.8 170.8S153.8 427.4 248 427.4c53.9 0 99.4-20.4 132.3-52.6l76.2 76.2C411.3 483.8 338.5 504 248 504z"></path></svg>
          }
          Google
        </Button>
        <Button variant="outline" className="w-full" onClick={() => setFormType(formType === 'phone' ? 'login' : 'phone')} disabled={isLoading}>
          {formType === 'phone' ? 'Sign in with Email' : 'Sign in with Phone'}
        </Button>
        <div className="text-center text-sm">
          {formType === 'login' ? (
            <>
              Don&apos;t have an account?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => setFormType('signup')}>Sign up</Button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => setFormType('login')}>Sign in</Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
