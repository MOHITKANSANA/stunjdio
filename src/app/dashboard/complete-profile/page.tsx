
"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { updateProfile } from "firebase/auth";
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
import { Loader2, Upload, BookOpenCheck } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const profileSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

export default function CompleteProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [aspect, setAspect] = useState<number | undefined>(1);
  const imgRef = useRef<HTMLImageElement>(null);
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
  
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }
  
  const getCroppedImgDataUrl = (): string | null => {
      if (!completedCrop || !imgRef.current) {
        return null;
      }
      
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      canvas.width = Math.floor(completedCrop.width * scaleX);
      canvas.height = Math.floor(completedCrop.height * scaleY);
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return null;
      }

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );
      
      return canvas.toDataURL('image/jpeg', 0.8);
  }

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsLoading(true);
    try {
      let photoURL = user.photoURL;
      
      const croppedImageDataUrl = getCroppedImgDataUrl();
      if(croppedImageDataUrl) {
          photoURL = croppedImageDataUrl;
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
  
  const currentAvatarSrc = imgSrc ? undefined : (user?.photoURL || undefined);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
                <BookOpenCheck className="h-10 w-10" />
            </div>
          <CardTitle className="text-3xl font-headline">Complete Your Profile</CardTitle>
          <CardDescription>
            Please provide your name and an optional profile picture.
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              
              {!imgSrc && (
                <>
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={currentAvatarSrc} />
                    <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                  </Avatar>
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </Button>
                </>
              )}
              
               <Input
                  id="photoFile"
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg"
                  ref={fileInputRef}
                  onChange={onFileSelect}
                />

               {imgSrc && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <p className="text-sm text-muted-foreground">Crop your new profile picture</p>
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                    className="max-h-[300px] max-w-[300px]"
                  >
                    <img
                      ref={imgRef}
                      alt="Crop me"
                      src={imgSrc}
                      onLoad={onImageLoad}
                      className="max-h-[300px]"
                    />
                  </ReactCrop>
                </div>
               )}
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
