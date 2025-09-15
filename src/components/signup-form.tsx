
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenCheck, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { UserCredential } from "firebase/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { statesAndDistricts } from "@/lib/states-districts";

const signupSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Invalid email address." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    state: z.string().min(1, { message: "Please select your state." }),
    district: z.string().min(1, { message: "Please select your district." }),
    photoFile: z.instanceof(File).optional(),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { signupWithDetails } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            state: "",
            district: "",
        },
    });

    const selectedState = form.watch("state");

    const handleSuccess = (userCredential: UserCredential) => {
        toast({ title: "Signup successful!", description: "Welcome to Go Swami Coaching Classes." });
        router.push("/dashboard");
    }

    const fileToDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          form.setValue("photoFile", file, { shouldValidate: true });
          setPreviewImage(URL.createObjectURL(file));
        }
    };

    const onSubmit = async (data: SignupFormValues) => {
        setIsLoading(true);
        try {
            let photoURL: string | null = null;
            if(data.photoFile) {
                photoURL = await fileToDataUrl(data.photoFile);
            }
            const userCredential = await signupWithDetails(data.email, data.password, data.name, photoURL, {state: data.state, district: data.district});
            handleSuccess(userCredential);
        } catch (error: any) {
            toast({
                title: "Signup Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md bg-card shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
                        <BookOpenCheck className="h-10 w-10" />
                    </div>
                    <CardTitle className="text-3xl font-headline text-card-foreground">Create an Account</CardTitle>
                    <CardDescription>Join Go Swami Coaching Classes today!</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="flex flex-col items-center space-y-2">
                             <Avatar className="h-24 w-24">
                                <AvatarImage src={previewImage || undefined} />
                                <AvatarFallback>
                                    <Upload />
                                </AvatarFallback>
                             </Avatar>
                             <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                Upload Photo
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/png, image/jpeg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" placeholder="Student Name" {...form.register("name")} />
                            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                        </div>
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Select onValueChange={(value) => form.setValue("state", value, { shouldValidate: true })}>
                                    <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(statesAndDistricts).map(state => (
                                            <SelectItem key={state} value={state}>{state}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.state && <p className="text-xs text-destructive">{form.formState.errors.state.message}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="district">District</Label>
                                <Select onValueChange={(value) => form.setValue("district", value, { shouldValidate: true })} disabled={!selectedState}>
                                    <SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger>
                                    <SelectContent>
                                        {selectedState && statesAndDistricts[selectedState]?.map(district => (
                                            <SelectItem key={district} value={district}>{district}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.district && <p className="text-xs text-destructive">{form.formState.errors.district.message}</p>}
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign Up
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <div className="text-center text-sm">
                        Already have an account?{" "}
                        <Button variant="link" className="p-0 h-auto" asChild>
                           <Link href="/login">Sign In</Link>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
