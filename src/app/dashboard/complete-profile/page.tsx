
"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth, updateUserInFirestore } from "@/hooks/use-auth";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { statesAndDistricts } from "@/lib/states-districts";
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  state: z.string().min(1, { message: "Please select your state." }),
  district: z.string().min(1, { message: "Please select your district." }),
  classOrExam: z.string().min(1, { message: "Please select your class or exam." }),
  board: z.string().min(1, { message: "Please select your board." }),
  ageGroup: z.string().min(1, { message: "Please select your age group." }),
  photoFile: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const classOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "SSC", "NDA", "CDS", "Army", "UPSC", "NTPC", "PCS"];
const boardOptions = ["State Board", "CBSE", "ICSE", "Other"];
const ageGroupOptions = ["Age 1-5", "5+"];

// Function to get cropped image data URL
function getCroppedImg(image: HTMLImageElement, crop: Crop, fileName: string): Promise<string> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return Promise.reject(new Error('Canvas context is not available'));
    }

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
    );

    return new Promise((resolve) => {
        resolve(canvas.toDataURL('image/jpeg', 0.8)); // Use JPEG for better compression
    });
}


export default function CompleteProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.displayName || "",
      state: "",
      district: "",
      classOrExam: "",
      board: "",
      ageGroup: "",
      photoFile: undefined,
    },
  });

  const selectedState = form.watch("state");

  if (!user) {
    router.push('/');
    return null;
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const makeClientCrop = async (crop: Crop) => {
    if (imgRef.current && crop.width && crop.height) {
        const cropped = await getCroppedImg(
            imgRef.current,
            crop,
            'newFile.jpeg'
        );
        setCroppedImageUrl(cropped);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsLoading(true);
    try {
      let photoURL = user.photoURL;
      
      if(croppedImageUrl) {
          photoURL = croppedImageUrl;
      }

      await updateProfile(user, {
        displayName: data.name,
        photoURL: photoURL,
      });
      
      await updateUserInFirestore(user, {
        displayName: data.name,
        photoURL: photoURL,
        state: data.state,
        district: data.district,
        classOrExam: data.classOrExam,
        board: data.board,
        ageGroup: data.ageGroup
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
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "S";
    return name.charAt(0);
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
                <BookOpenCheck className="h-10 w-10" />
            </div>
          <CardTitle className="text-3xl font-headline">Complete Your Profile</CardTitle>
          <CardDescription>
            Please provide a few more details to personalize your experience.
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
             <div className="flex flex-col items-center space-y-2">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={croppedImageUrl || user?.photoURL || undefined} />
                    <AvatarFallback><Upload /></AvatarFallback>
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
                 {previewImage && (
                    <div className="mt-4">
                        <p className="text-center text-sm text-muted-foreground">Crop your image</p>
                        <ReactCrop
                            crop={crop}
                            onChange={c => setCrop(c)}
                            onComplete={makeClientCrop}
                            aspect={1}
                        >
                            <img ref={imgRef} src={previewImage} alt="Crop preview" />
                        </ReactCrop>
                    </div>
                )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="e.g. Student Name" {...form.register("name")} />
              {form.formState.errors.name && (<p className="text-xs text-destructive">{form.formState.errors.name.message}</p>)}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="ageGroup">Age Group</Label>
                    <Select onValueChange={(value) => form.setValue("ageGroup", value, { shouldValidate: true })}>
                        <SelectTrigger><SelectValue placeholder="Select Age Group" /></SelectTrigger>
                        <SelectContent>
                            {ageGroupOptions.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    {form.formState.errors.ageGroup && <p className="text-xs text-destructive">{form.formState.errors.ageGroup.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="classOrExam">Class / Exam</Label>
                    <Select onValueChange={(value) => form.setValue("classOrExam", value, { shouldValidate: true })}>
                        <SelectTrigger><SelectValue placeholder="Select Class/Exam" /></SelectTrigger>
                        <SelectContent>
                            {classOptions.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    {form.formState.errors.classOrExam && <p className="text-xs text-destructive">{form.formState.errors.classOrExam.message}</p>}
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="board">Board</Label>
                    <Select onValueChange={(value) => form.setValue("board", value, { shouldValidate: true })}>
                        <SelectTrigger><SelectValue placeholder="Select Board" /></SelectTrigger>
                        <SelectContent>
                           {boardOptions.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    {form.formState.errors.board && <p className="text-xs text-destructive">{form.formState.errors.board.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select onValueChange={(value) => form.setValue("state", value, { shouldValidate: true })}>
                        <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                        <SelectContent>
                            {Object.keys(statesAndDistricts).map(state => (<SelectItem key={state} value={state}>{state}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    {form.formState.errors.state && <p className="text-xs text-destructive">{form.formState.errors.state.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Select onValueChange={(value) => form.setValue("district", value, { shouldValidate: true })} disabled={!selectedState}>
                    <SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger>
                    <SelectContent>
                        {selectedState && statesAndDistricts[selectedState]?.map(district => (<SelectItem key={district} value={district}>{district}</SelectItem>))}
                    </SelectContent>
                </Select>
                {form.formState.errors.district && <p className="text-xs text-destructive">{form.formState.errors.district.message}</p>}
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
