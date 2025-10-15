'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const motivationItemSchema = z.object({
  type: z.enum(['gallery', 'short_video', 'full_video']),
  title: z.string().min(1, 'Title is required.'),
  fileUrl: z.string().url('A valid URL is required for videos.'),
  thumbnailFile: z.any().optional(), // Optional for videos, required for gallery
}).refine(data => {
    if (data.type === 'gallery' && !data.thumbnailFile) {
        return false;
    }
    return true;
}, {
    message: 'An image file is required for gallery items.',
    path: ['thumbnailFile'],
});

type MotivationFormValues = z.infer<typeof motivationItemSchema>;

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function AddMotivationItemForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<MotivationFormValues>({
    resolver: zodResolver(motivationItemSchema),
    defaultValues: {
      type: 'gallery',
      title: '',
      fileUrl: '',
    },
  });

  const type = form.watch('type');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      form.setValue('thumbnailFile', file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: MotivationFormValues) => {
    setIsLoading(true);
    try {
      let thumbnailUrl = '';
      if (data.thumbnailFile) {
        thumbnailUrl = await fileToDataUrl(data.thumbnailFile);
      }
      
      const collectionName = data.type === 'gallery' ? 'galleryImages' : 'motivationVideos';
      
      await addDoc(collection(firestore, collectionName), {
        title: data.title,
        url: data.type === 'gallery' ? thumbnailUrl : data.fileUrl,
        thumbnailUrl: data.type !== 'gallery' ? thumbnailUrl : '', // For videos, store thumb separately
        type: data.type,
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Success', description: 'Item added to motivation section.' });
      form.reset();
      setPreview(null);
    } catch (error) {
      console.error('Error adding item:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add item.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select content type" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="gallery">Gallery Image</SelectItem>
                  <SelectItem value="short_video">Short Video</SelectItem>
                  <SelectItem value="full_video">Full Video</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Annual Function 2023" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        {type !== 'gallery' && (
             <FormField control={form.control} name="fileUrl" render={({ field }) => (
                <FormItem><FormLabel>Video URL</FormLabel><FormControl><Input placeholder="https://youtube.com/..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        )}
        
        <FormField
          control={form.control}
          name="thumbnailFile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{type === 'gallery' ? 'Image' : 'Thumbnail (Optional)'}</FormLabel>
              <FormControl>
                <div>
                  <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    {preview ? 'Change File' : 'Upload File'}
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
              {preview && (
                  <Image src={preview} alt="Image preview" width={100} height={100} className="mt-2 rounded-md" />
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Item
        </Button>
      </form>
    </Form>
  );
}
