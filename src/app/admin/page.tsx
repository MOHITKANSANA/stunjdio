
'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc, setDoc, addDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Loader2, Trash2, PlusCircle, MinusCircle, Check, X } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Image from 'next/image';
import Link from 'next/link';

const courseFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(3, 'Category must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  imageUrl: z.string().url('Must be a valid image URL').optional().or(z.literal('')),
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
  const [enrollmentsCollection, enrollmentsLoading, enrollmentsError] = useCollection(query(collection(firestore, 'enrollments'), orderBy('createdAt', 'desc')));
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
    defaultValues: { title: '', category: '', description: '', price: 0, imageUrl: '' },
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
    // Implementation for saving dashboard image
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
    // Implementation for toggling top student
  }

  const handleEnrollmentAction = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const enrollmentRef = doc(firestore, 'enrollments', id);
      await updateDoc(enrollmentRef, { status: newStatus });
      toast({ title: 'Success', description: `Enrollment has been ${newStatus}.` });
    } catch (error) {
      console.error("Error updating enrollment: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update enrollment status.' });
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <h1 className="text-3xl font-semibold font-headline">Administration</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Column 1 */}
        <div className="lg:col-span-1 flex flex-col gap-6">
            <Card>
              <CardHeader><CardTitle>Create New Course</CardTitle><CardDescription>Fill out the details below to add a new course.</CardDescription></CardHeader>
              <CardContent><Form {...courseForm}><form onSubmit={courseForm.handleSubmit(onCourseSubmit)} className="grid gap-6">
                  <FormField control={courseForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Course Title</FormLabel><FormControl><Input placeholder="e.g. Algebra Fundamentals" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={courseForm.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g. Maths" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={courseForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price (INR)</FormLabel><FormControl><Input type="number" placeholder="e.g. 499" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={courseForm.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Cover Image URL (Optional)</FormLabel><FormControl><Input placeholder="https://picsum.photos/600/400" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={courseForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A short description of the course content." className="min-h-32" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <Button type="submit" disabled={courseForm.formState.isSubmitting}>{courseForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Creating...</> : "Create Course"}</Button>
              </form></Form></CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Live Class Management</CardTitle><CardDescription>Add, view, and manage live classes.</CardDescription></CardHeader>
              <CardContent><Form {...liveClassForm}><form onSubmit={liveClassForm.handleSubmit(onLiveClassSubmit)} className="grid gap-4 mb-6">
                  <FormField control={liveClassForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Class Title</FormLabel><FormControl><Input placeholder="e.g. Maths Special Session" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={liveClassForm.control} name="youtubeUrl" render={({ field }) => (<FormItem><FormLabel>YouTube URL</FormLabel><FormControl><Input placeholder="https://www.youtube.com/watch?v=..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={liveClassForm.control} name="startTime" render={({ field }) => (<FormItem><FormLabel>Start Time</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <Button type="submit" disabled={liveClassForm.formState.isSubmitting}>{liveClassForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Adding...</> : "Add Live Class"}</Button>
              </form></Form>
              <h4 className="font-semibold mb-2">Scheduled Classes</h4>
              <div className="max-h-60 overflow-y-auto pr-2"><Table><TableBody>
                  {liveClassesLoading && <TableRow><TableCell><Skeleton className="h-9 w-full" /></TableCell></TableRow>}
                  {liveClassesCollection?.docs.map(doc => {
                      const liveClass = doc.data();
                      const startTime = liveClass.startTime?.toDate();
                      return (<TableRow key={doc.id}><TableCell>
                          <p className="font-medium">{liveClass.title}</p>
                          <p className="text-sm text-muted-foreground">{startTime ? startTime.toLocaleString() : 'Invalid Date'}</p>
                      </TableCell><TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteLiveClass(doc.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                      </TableCell></TableRow>)
                  })}
              </TableBody></Table></div></CardContent>
            </Card>
        </div>

        {/* Column 2 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Enrollment Requests</CardTitle><CardDescription>Review and approve student course enrollments.</CardDescription></CardHeader>
            <CardContent>
              {enrollmentsError && <p className="text-destructive">Error: {enrollmentsError.message}</p>}
              <div className="max-h-[800px] overflow-y-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Course</TableHead><TableHead>Screenshot</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {enrollmentsLoading && Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                    ))}
                    {enrollmentsCollection?.docs.map((doc) => {
                      const enrollment = doc.data();
                      return (
                        <TableRow key={doc.id}>
                          <TableCell><div className="font-medium">{enrollment.userDisplayName}</div><div className="text-sm text-muted-foreground">{enrollment.userEmail}</div></TableCell>
                          <TableCell>{enrollment.courseTitle}</TableCell>
                          <TableCell>
                            <Link href={enrollment.screenshotUrl} target="_blank" rel="noopener noreferrer">
                              <Image src={enrollment.screenshotUrl} alt="Payment Screenshot" width={80} height={80} className="rounded-md object-cover" />
                            </Link>
                          </TableCell>
                          <TableCell><Badge variant={enrollment.status === 'pending' ? 'secondary' : enrollment.status === 'approved' ? 'default' : 'destructive'}>{enrollment.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            {enrollment.status === 'pending' && (
                              <div className="flex gap-2 justify-end">
                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEnrollmentAction(doc.id, 'approved')}><Check className="h-4 w-4 text-green-500" /></Button>
                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEnrollmentAction(doc.id, 'rejected')}><X className="h-4 w-4 text-red-500" /></Button>
                              </div>
                            )}
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
      </div>
    </div>
  );
}
