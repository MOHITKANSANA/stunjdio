
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Loader2 } from 'lucide-react';

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

export default function AdminPage() {
  const [value, loading, error] = useCollection(query(collection(firestore, 'users'), orderBy('lastLogin', 'desc')));
  const { toast } = useToast();
  
  // State for image upload and crop
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [aspect, setAspect] = useState<number | undefined>(150 / 100);
  const [isUploading, setIsUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSaveImage = async () => {
    if (!completedCrop || !imgRef.current) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please crop the image first.' });
      return;
    }
    setIsUploading(true);
    
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = Math.floor(completedCrop.width * scaleX);
    canvas.height = Math.floor(completedCrop.height * scaleY);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsUploading(false);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not process image.' });
      return;
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

    const base64Image = canvas.toDataURL('image/jpeg', 0.9); // Adjust quality as needed
      
    try {
      const configDocRef = doc(firestore, 'app_config', 'dashboard');
      await setDoc(configDocRef, { heroImageDataUri: base64Image });

      toast({ title: 'Success!', description: 'Dashboard image updated successfully.' });
      setImgSrc('');
      setCompletedCrop(undefined);
      if(fileInputRef.current) fileInputRef.current.value = "";
    } catch (uploadError) {
      console.error("Upload failed:", uploadError);
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not save image to Firestore.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <h1 className="text-3xl font-semibold font-headline">Administration</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Course</CardTitle>
            <CardDescription>Fill out the details below to add a new course to the catalog.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-6">
              <div className="grid gap-3"><Label htmlFor="title">Course Title</Label><Input id="title" type="text" className="w-full" placeholder="e.g. Algebra Fundamentals"/></div>
              <div className="grid gap-3"><Label htmlFor="category">Category</Label><Input id="category" type="text" className="w-full" placeholder="e.g. Maths"/></div>
              <div className="grid gap-3"><Label htmlFor="description">Description</Label><Textarea id="description" placeholder="A short description of the course content." className="min-h-32"/></div>
              <Button type="submit">Create Course</Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Update Dashboard Image</CardTitle>
              <CardDescription>Upload and crop the hero image for the dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
               <Input ref={fileInputRef} type="file" accept="image/*" onChange={onFileSelect} />
               {imgSrc && (
                <div className="flex flex-col items-center gap-4">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                    className="max-h-[400px]"
                  >
                    <img
                      ref={imgRef}
                      alt="Crop me"
                      src={imgSrc}
                      onLoad={onImageLoad}
                      className="max-h-[400px]"
                    />
                  </ReactCrop>
                  <Button onClick={handleSaveImage} disabled={!completedCrop || isUploading}>
                    {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Image"}
                  </Button>
                </div>
               )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage users who have logged into the app.</CardDescription>
            </CardHeader>
            <CardContent>
              {error && <p className="text-destructive">Error: {error.message}</p>}
              <Table>
                <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Last Login</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading && (<><TableRow><TableCell><Skeleton className="h-9 w-full" /></TableCell><TableCell><Skeleton className="h-9 w-full" /></TableCell></TableRow><TableRow><TableCell><Skeleton className="h-9 w-full" /></TableCell><TableCell><Skeleton className="h-9 w-full" /></TableCell></TableRow></>)}
                  {value && value.docs.map((doc) => {
                    const user = doc.data();
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9"><AvatarImage src={user.photoURL || undefined} alt={user.displayName} data-ai-hint="student" /><AvatarFallback>{getInitials(user.displayName)}</AvatarFallback></Avatar>
                            <div className="font-medium"><p>{user.displayName}</p><p className="text-sm text-muted-foreground">{user.email}</p></div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{user.lastLogin && user.lastLogin.seconds ? new Date(user.lastLogin.seconds * 1000).toLocaleDateString() : 'N/A'}</Badge></TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
