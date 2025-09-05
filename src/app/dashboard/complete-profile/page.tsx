
"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { app } from "@/lib/firebase";

const profileSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  photoFile: z.instanceof(File).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const storage = getStorage(app);

export default function CompleteProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
    },
  });

  if (!user) {
    router.push('/');
    return null;
  }
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "S";
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return names[0].charAt(0) + names[names.length - 1].charAt(0);
    }
    return name.charAt(0);
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      form.setValue("photoFile", file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsLoading(true);
    try {
      let photoURL = user.photoURL;

      if (data.photoFile) {
        const storageRef = ref(storage, `profile-pictures/${user.uid}`);
        const snapshot = await uploadBytes(storageRef, data.photoFile);
        photoURL = await getDownloadURL(snapshot.ref);
      }

      await updateProfile(user, {
        displayName: data.displayName,
        photoURL: photoURL,
      });

      toast({ title: "Profile Updated!", description: "Your profile has been successfully updated." });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Please provide your name and an optional profile picture.
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
               <Avatar className="h-24 w-24">
                 <AvatarImage src={previewImage || user?.photoURL || undefined} />
                 <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
               </Avatar>
               <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                 <Upload className="mr-2 h-4 w-4" />
                 Upload Photo
               </Button>
               <Input
                  id="photoFile"
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name</Label>
              <Input
                id="displayName"
                placeholder="e.g. Student Name"
                {...form.register("displayName")}
              />
              {form.formState.errors.displayName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.displayName.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save and Continue
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
