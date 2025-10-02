
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

const kidsVideoSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  thumbnailUrl: z.string().url('Must be a valid URL.'),
  videoUrl: z.string().url('Must be a valid URL.'),
});

type KidsVideoFormValues = z.infer<typeof kidsVideoSchema>;

export function AddKidsVideoForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<KidsVideoFormValues>({
    resolver: zodResolver(kidsVideoSchema),
    defaultValues: {
      title: '',
      description: '',
      thumbnailUrl: '',
      videoUrl: '',
    },
  });

  const onSubmit = async (data: KidsVideoFormValues) => {
    setIsLoading(true);
    try {
      await addDoc(collection(firestore, 'kidsTubeVideos'), {
        ...data,
        createdAt: serverTimestamp(),
        likes: 0,
        dislikes: 0,
      });
      toast({ title: 'Success', description: 'Kids Tube video added successfully.' });
      form.reset();
    } catch (error) {
      console.error('Error adding video:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add video.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Video Title</FormLabel><FormControl><Input placeholder="e.g., Learn ABCs" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Short description of the video" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="thumbnailUrl" render={({ field }) => (
          <FormItem><FormLabel>Thumbnail URL</FormLabel><FormControl><Input placeholder="https://example.com/thumbnail.jpg" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="videoUrl" render={({ field }) => (
          <FormItem><FormLabel>Video URL</FormLabel><FormControl><Input placeholder="https://youtube.com/watch?v=..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Video
        </Button>
      </form>
    </Form>
  );
}
