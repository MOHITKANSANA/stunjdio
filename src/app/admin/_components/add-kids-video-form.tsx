
'use client';

import { useState, useRef, ChangeEvent } from 'react';
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
import { Loader2, Upload } from 'lucide-react';
import Image from 'next/image';

const kidsVideoSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  thumbnailFile: z.any().refine(file => file, 'Thumbnail is required.'),
  videoUrl: z.string().url('Must be a valid video URL.'),
});

type KidsVideoFormValues = z.infer<typeof kidsVideoSchema>;

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function AddKidsVideoForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const form = useForm<KidsVideoFormValues>({
    resolver: zodResolver(kidsVideoSchema),
    defaultValues: {
      title: '',
      description: '',
      videoUrl: '',
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      form.setValue('thumbnailFile', file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: KidsVideoFormValues) => {
    setIsLoading(true);
    try {
      const thumbnailUrl = await fileToDataUrl(data.thumbnailFile);
      
      await addDoc(collection(firestore, 'kidsTubeVideos'), {
        title: data.title,
        description: data.description,
        thumbnailUrl: thumbnailUrl,
        videoUrl: data.videoUrl,
        createdAt: serverTimestamp(),
        likes: 0,
        dislikes: 0,
      });

      toast({ title: 'Success', description: 'Kids Tube video added successfully.' });
      form.reset();
      setImagePreview(null);
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
        
        <FormField
          control={form.control}
          name="thumbnailFile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thumbnail Image</FormLabel>
              <FormControl>
                <div>
                  <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    {imagePreview ? 'Change Image' : 'Upload Thumbnail'}
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </FormControl>
              {imagePreview && <Image src={imagePreview} alt="Thumbnail preview" width={100} height={100} className="mt-2 rounded-md" />}
              <FormMessage />
            </FormItem>
          )}
        />

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
