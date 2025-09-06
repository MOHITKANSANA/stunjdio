
'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc, setDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Loader2, Trash2, PlusCircle, MinusCircle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const courseFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
});
type CourseFormValues = z.infer<typeof courseFormSchema>;

const liveClassFormSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    youtubeUrl: z.string().url('Must be a valid YouTube URL'),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
});
type LiveClassFormValues = z.infer<typeof liveClassFormSchema>;


function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

export default function AdminPage() {
  const [usersCollection, usersLoading, usersError] = useCollection(query(collection(firestore, 'users'), orderBy('lastLogin', 'desc')));
  const [liveClassesCollection, liveClassesLoading, liveClassesError] = useCollection(query(collection(firestore, 'live_classes'), orderBy('startTime', 'desc')));
  const [topStudentsCollection, topStudentsLoading, topStudentsError] = useCollection(collection(firestore, 'top_students'));

  const { toast } = useToast();
  
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [aspect, setAspect] = useState<number | undefined>(150 / 100);
  const [isUploading, setIsUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const courseForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: { title: '', category: '', description: '' },
  });

  const liveClassForm = useForm<LiveClassFormValues>({
    resolver: zodResolver(liveClassFormSchema),
    defaultValues: { title: '', youtubeUrl: '', startTime: '' }
  });

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
      setCrop(undefined);
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

    const base64Image = canvas.toDataURL('image/jpeg', 0.9);
      
    try {
      const configDocRef = doc(firestore, 'app_config', 'dashboard');
      await setDoc(configDocRef, { heroImageDataUri: base64Image }, { merge: true });

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

  const onCourseSubmit = async (data: CourseFormValues) => {
    try {
      await addDoc(collection(firestore, 'courses'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Success', description: 'Course created successfully.' });
      courseForm.reset();
    } catch (error) {
      console.error("Error creating course: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create course.' });
    }
  };


  const onLiveClassSubmit = async (data: LiveClassFormValues) => {
    try {
        const startTime = new Date(data.startTime);
        await addDoc(collection(firestore, 'live_classes'), {
            title: data.title,
            youtubeUrl: data.youtubeUrl,
            startTime: startTime,
            createdAt: serverTimestamp(),
        });
        toast({ title: 'Success', description: 'Live class added.' });
        liveClassForm.reset();
    } catch (error) {
        console.error("Error adding live class: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add live class.' });
    }
  };

  const deleteLiveClass = async (id: string) => {
    if(window.confirm('Are you sure you want to delete this class?')) {
        await deleteDoc(doc(firestore, 'live_classes', id));
        toast({ description: 'Live class deleted.' });
    }
  }

  const isTopStudent = (userId: string) => {
    return topStudentsCollection?.docs.some(doc => doc.id === userId);
  }

  const toggleTopStudent = async (user: any) => {
    const userDocRef = doc(firestore, 'top_students', user.uid);
    if(isTopStudent(user.uid)) {
        await deleteDoc(userDocRef);
        toast({ description: `${user.displayName} removed from top students.` });
    } else {
        if(topStudentsCollection && topStudentsCollection.docs.length >= 10) {
            toast({ variant: 'destructive', title: 'Limit Reached', description: 'You can only have 10 top students.' });
            return;
        }
        await setDoc(userDocRef, {
            name: user.displayName,
            avatarUrl: user.photoURL,
            addedAt: serverTimestamp(),
        });
        toast({ title: 'Success', description: `${user.displayName} added to top students.` });
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <h1 className="text-3xl font-semibold font-headline">Administration</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Column 1 */}
        <div className="lg:col-span-1 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Course</CardTitle>
                <CardDescription>Fill out the details below to add a new course to the catalog.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...courseForm}>
                  <form onSubmit={courseForm.handleSubmit(onCourseSubmit)} className="grid gap-6">
                    <FormField
                      control={courseForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem><FormLabel>Course Title</FormLabel><FormControl><Input placeholder="e.g. Algebra Fundamentals" {...field} /></FormControl><FormMessage /></FormItem>
                      )}
                    />
                    <FormField
                      control={courseForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g. Maths" {...field} /></FormControl><FormMessage /></FormItem>
                      )}
                    />
                    <FormField
                      control={courseForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A short description of the course content." className="min-h-32" {...field} /></FormControl><FormMessage /></FormItem>
                      )}
                    />
                    <Button type="submit" disabled={courseForm.formState.isSubmitting}>
                      {courseForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Creating...</> : "Create Course"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Update Dashboard Image</CardTitle>
                <CardDescription>Upload and crop the hero image for the dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                 <Input ref={fileInputRef} type="file" accept="image/*" onChange={onFileSelect} />
                 {imgSrc && (
                  <div className="flex flex-col items-center gap-4">
                    <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={aspect} className="max-h-[400px]">
                      <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} className="max-h-[400px]"/>
                    </ReactCrop>
                    <Button onClick={handleSaveImage} disabled={!completedCrop || isUploading}>
                      {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Image"}
                    </Button>
                  </div>
                 )}
              </CardContent>
            </Card>
        </div>

        {/* Column 2 */}
        <div className="lg:col-span-1 flex flex-col gap-6">
           <Card>
              <CardHeader>
                <CardTitle>Live Class Management</CardTitle>
                <CardDescription>Add, view, and manage live classes.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...liveClassForm}>
                  <form onSubmit={liveClassForm.handleSubmit(onLiveClassSubmit)} className="grid gap-4 mb-6">
                    <FormField
                      control={liveClassForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem><FormLabel>Class Title</FormLabel><FormControl><Input placeholder="e.g. Maths Special Session" {...field} /></FormControl><FormMessage /></FormItem>
                      )}
                    />
                     <FormField
                      control={liveClassForm.control}
                      name="youtubeUrl"
                      render={({ field }) => (
                        <FormItem><FormLabel>YouTube URL</FormLabel><FormControl><Input placeholder="https://www.youtube.com/watch?v=..." {...field} /></FormControl><FormMessage /></FormItem>
                      )}
                    />
                     <FormField
                      control={liveClassForm.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem><FormLabel>Start Time</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
                      )}
                    />
                    <Button type="submit" disabled={liveClassForm.formState.isSubmitting}>
                      {liveClassForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Adding...</> : "Add Live Class"}
                    </Button>
                  </form>
                </Form>
                <h4 className="font-semibold mb-2">Scheduled Classes</h4>
                <div className="max-h-60 overflow-y-auto pr-2">
                    <Table>
                        <TableBody>
                            {liveClassesLoading && <TableRow><TableCell><Skeleton className="h-9 w-full" /></TableCell></TableRow>}
                            {liveClassesCollection && liveClassesCollection.docs.map(doc => {
                                const liveClass = doc.data();
                                return (
                                    <TableRow key={doc.id}>
                                        <TableCell>
                                            <p className="font-medium">{liveClass.title}</p>
                                            <p className="text-sm text-muted-foreground">{new Date(liveClass.startTime.seconds * 1000).toLocaleString()}</p>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => deleteLiveClass(doc.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Top 10 Students</CardTitle>
                    <CardDescription>Select up to 10 students to feature on the dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                     {topStudentsError && <p className="text-destructive">Error: {topStudentsError.message}</p>}
                     <div className="max-h-96 overflow-y-auto">
                        <Table>
                             <TableHeader><TableRow><TableHead>Student</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {usersLoading && <TableRow><TableCell><Skeleton className="h-9 w-full"/></TableCell><TableCell><Skeleton className="h-9 w-9 ml-auto"/></TableCell></TableRow>}
                                {usersCollection && usersCollection.docs.map(doc => {
                                    const user = doc.data();
                                    const isSelected = isTopStudent(doc.id);
                                    return (
                                        <TableRow key={doc.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9"><AvatarImage src={user.photoURL || undefined} alt={user.displayName} /><AvatarFallback>{getInitials(user.displayName)}</AvatarFallback></Avatar>
                                                    <div><p className="font-medium">{user.displayName}</p><p className="text-sm text-muted-foreground">{user.email}</p></div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="icon" onClick={() => toggleTopStudent({uid: doc.id, ...user})}>
                                                    {isSelected ? <MinusCircle className="h-4 w-4 text-red-500"/> : <PlusCircle className="h-4 w-4 text-green-500"/>}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                     </div>
                </CardContent>
            </Card>
        </div>
        
        {/* Column 3 */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage users who have logged into the app.</CardDescription>
            </CardHeader>
            <CardContent>
              {usersError && <p className="text-destructive">Error: {usersError.message}</p>}
              <div className="max-h-[800px] overflow-y-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Last Login</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {usersLoading && (<><TableRow><TableCell><Skeleton className="h-9 w-full" /></TableCell><TableCell><Skeleton className="h-9 w-full" /></TableCell></TableRow><TableRow><TableCell><Skeleton className="h-9 w-full" /></TableCell><TableCell><Skeleton className="h-9 w-full" /></TableCell></TableRow></>)}
                    {usersCollection && usersCollection.docs.map((doc) => {
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
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
