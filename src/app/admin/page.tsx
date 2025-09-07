
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
import { Badge } from "@/components/ui/badge";
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Check, X, Upload, Video, FileText, StickyNote } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Image from 'next/image';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const courseFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(3, 'Category must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  imageFile: z.instanceof(File).optional(),
});
type CourseFormValues = z.infer<typeof courseFormSchema>;

const liveClassFormSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    youtubeUrl: z.string().url('Must be a valid YouTube URL'),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
});
type LiveClassFormValues = z.infer<typeof liveClassFormSchema>;

const qrCodeFormSchema = z.object({
    imageFile: z.instanceof(File, { message: 'Please upload an image file.' }),
});
type QrCodeFormValues = z.infer<typeof qrCodeFormSchema>;

const courseContentSchema = z.object({
    courseId: z.string().min(1, "Please select a course."),
    contentType: z.enum(['video', 'pdf', 'note']),
    title: z.string().min(3, 'Content title is required.'),
    url: z.string().url('A valid URL is required.'),
});
type CourseContentValues = z.infer<typeof courseContentSchema>;

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
};

export default function AdminPage() {
  const [enrollmentsCollection, enrollmentsLoading, enrollmentsError] = useCollection(query(collection(firestore, 'enrollments'), orderBy('createdAt', 'desc')));
  const [liveClassesCollection, liveClassesLoading, liveClassesError] = useCollection(query(collection(firestore, 'live_classes'), orderBy('startTime', 'desc')));
  const [coursesCollection, coursesLoading, coursesError] = useCollection(query(collection(firestore, 'courses'), orderBy('title', 'asc')));
  const [qrCodeDoc] = useCollection(collection(firestore, 'settings'));
  const qrCodeUrl = qrCodeDoc?.docs.find(d => d.id === 'paymentQrCode')?.data().url;

  const { toast } = useToast();
  
  const courseForm = useForm<CourseFormValues>({ resolver: zodResolver(courseFormSchema) });
  const liveClassForm = useForm<LiveClassFormValues>({ resolver: zodResolver(liveClassFormSchema) });
  const qrCodeForm = useForm<QrCodeFormValues>({ resolver: zodResolver(qrCodeFormSchema) });
  const courseContentForm = useForm<CourseContentValues>({ resolver: zodResolver(courseContentSchema) });

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
  
  const uploadImage = async (file: File, path: string): Promise<string> => {
    const storage = getStorage();
    const storageRef = ref(storage, path);
    const dataUrl = await fileToDataUrl(file);
    await uploadString(storageRef, dataUrl, 'data_url');
    return getDownloadURL(storageRef);
  };

  const onCourseSubmit = async (data: CourseFormValues) => {
    try {
      let imageUrl = 'https://picsum.photos/600/400';
      if (data.imageFile) {
        imageUrl = await uploadImage(data.imageFile, `courses/${Date.now()}-${data.imageFile.name}`);
      }
      
      await addDoc(collection(firestore, 'courses'), {
        title: data.title,
        category: data.category,
        description: data.description,
        price: data.price,
        imageUrl: imageUrl,
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

  const onCourseContentSubmit = async (data: CourseContentValues) => {
    try {
        const contentCollectionRef = collection(firestore, 'courses', data.courseId, 'content');
        await addDoc(contentCollectionRef, {
            type: data.contentType,
            title: data.title,
            url: data.url,
            createdAt: serverTimestamp(),
        });
        toast({ title: 'Success', description: 'Content added to course.' });
        courseContentForm.reset();
    } catch (error) {
        console.error("Error adding course content: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add content.' });
    }
  };

  const deleteLiveClass = async (id: string) => {
    if(window.confirm('Are you sure you want to delete this class?')) {
        await deleteDoc(doc(firestore, 'live_classes', id));
        toast({ description: 'Live class deleted.' });
    }
  }
  
  const onQrCodeSubmit = async (data: QrCodeFormValues) => {
    try {
      const imageUrl = await uploadImage(data.imageFile, `settings/qr-code.jpg`);
      const settingsRef = doc(firestore, 'settings', 'paymentQrCode');
      await updateDoc(settingsRef, { url: imageUrl }, { merge: true });
      toast({ title: 'Success', description: 'QR Code updated.' });
      qrCodeForm.reset();
    } catch (error) {
       console.error("Error updating QR code: ", error);
       toast({ variant: 'destructive', title: 'Error', description: 'Could not update QR code.' });
    }
  };


  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6">
      <h1 className="text-3xl font-semibold font-headline">Administration</h1>
      <Tabs defaultValue="enrollments">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="content">Content Management</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="enrollments">
           <Card>
            <CardHeader><CardTitle>Enrollment Requests</CardTitle><CardDescription>Review and approve student course enrollments.</CardDescription></CardHeader>
            <CardContent>
              {enrollmentsError && <p className="text-destructive">Error: {enrollmentsError.message}</p>}
              <div className="max-h-[800px] overflow-y-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Request</TableHead><TableHead>Screenshot</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
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
                            <Link href={enrollment.screenshotDataUrl} target="_blank" rel="noopener noreferrer">
                              <Image src={enrollment.screenshotDataUrl} alt="Payment Screenshot" width={80} height={80} className="rounded-md object-cover" />
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
        </TabsContent>
        <TabsContent value="content">
          <div className="grid md:grid-cols-2 gap-6">
             <Card>
              <CardHeader><CardTitle>Create New Course</CardTitle><CardDescription>Fill out the details below to add a new course.</CardDescription></CardHeader>
              <CardContent><Form {...courseForm}><form onSubmit={courseForm.handleSubmit(onCourseSubmit)} className="grid gap-6">
                  <FormField control={courseForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Course Title</FormLabel><FormControl><Input placeholder="e.g. Algebra Fundamentals" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={courseForm.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g. Maths" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={courseForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price (INR)</FormLabel><FormControl><Input type="number" placeholder="e.g. 499" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={courseForm.control} name="imageFile" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image</FormLabel>
                      <FormControl>
                        <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files?.[0])} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={courseForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A short description of the course content." className="min-h-32" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <Button type="submit" disabled={courseForm.formState.isSubmitting}>{courseForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Creating...</> : "Create Course"}</Button>
              </form></Form></CardContent>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Manage Course Content</CardTitle><CardDescription>Add videos, PDFs, and notes to your courses.</CardDescription></CardHeader>
                    <CardContent>
                        <Form {...courseContentForm}><form onSubmit={courseContentForm.handleSubmit(onCourseContentSubmit)} className="grid gap-4">
                            <FormField control={courseContentForm.control} name="courseId" render={({ field }) => (<FormItem><FormLabel>Select Course</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Choose a course" /></SelectTrigger></FormControl>
                                <SelectContent>{coursesCollection?.docs.map(doc => (<SelectItem key={doc.id} value={doc.id}>{doc.data().title}</SelectItem>))}</SelectContent>
                            </Select><FormMessage /></FormItem>)}/>
                             <FormField control={courseContentForm.control} name="contentType" render={({ field }) => (<FormItem><FormLabel>Content Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Choose a content type" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="video"><div className="flex items-center"><Video className="mr-2 h-4 w-4" />Video (YouTube)</div></SelectItem>
                                    <SelectItem value="pdf"><div className="flex items-center"><FileText className="mr-2 h-4 w-4" />PDF Document</div></SelectItem>
                                    <SelectItem value="note"><div className="flex items-center"><StickyNote className="mr-2 h-4 w-4" />Note</div></SelectItem>
                                </SelectContent>
                            </Select><FormMessage /></FormItem>)}/>
                            <FormField control={courseContentForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Content Title</FormLabel><FormControl><Input placeholder="e.g. Chapter 1: Introduction" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={courseContentForm.control} name="url" render={({ field }) => (<FormItem><FormLabel>URL</FormLabel><FormControl><Input placeholder="https://youtube.com/watch?v=... or https://..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                             <Button type="submit" disabled={courseContentForm.formState.isSubmitting}>{courseContentForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Adding...</> : "Add Content"}</Button>
                        </form></Form>
                    </CardContent>
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
           
          </div>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader><CardTitle>Payment QR Code</CardTitle><CardDescription>Upload or update the QR code for payments.</CardDescription></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 items-start">
              <Form {...qrCodeForm}>
                <form onSubmit={qrCodeForm.handleSubmit(onQrCodeSubmit)} className="space-y-4">
                   <FormField
                    control={qrCodeForm.control}
                    name="imageFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New QR Code Image</FormLabel>
                        <FormControl>
                          <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files?.[0])} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={qrCodeForm.formState.isSubmitting}>
                    {qrCodeForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Uploading...</> : <><Upload className="mr-2 h-4 w-4"/>Upload QR Code</>}
                  </Button>
                </form>
              </Form>
              <div>
                <h4 className="font-semibold mb-2">Current QR Code</h4>
                {qrCodeUrl ? (
                  <Image src={qrCodeUrl} alt="Payment QR Code" width={200} height={200} className="rounded-md border p-2" />
                ) : (
                  <p className="text-muted-foreground">No QR code uploaded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
