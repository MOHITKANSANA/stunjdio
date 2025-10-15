
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

const galleryImageSchema = z.object({
  title: z.string().optional(),
  imageFile: z.any().refine(file => file, 'Image is required.'),
});

type GalleryImageFormValues = z.infer<typeof galleryImageSchema>;

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function AddGalleryImageForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<GalleryImageFormValues>({
    resolver: zodResolver(galleryImageSchema),
    defaultValues: {
      title: '',
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      form.setValue('imageFile', file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: GalleryImageFormValues) => {
    setIsLoading(true);
    try {
      const imageUrl = await fileToDataUrl(data.imageFile);
      
      await addDoc(collection(firestore, 'galleryImages'), {
        title: data.title,
        url: imageUrl,
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Success', description: 'Image added to gallery.' });
      form.reset();
      setImagePreview(null);
    } catch (error) {
      console.error('Error adding image:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add image.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Image Title (Optional)</FormLabel><FormControl><Input placeholder="e.g., Annual Function 2023" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <FormField
          control={form.control}
          name="imageFile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image</FormLabel>
              <FormControl>
                <div>
                  <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    {imagePreview ? 'Change Image' : 'Upload Image'}
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
              {imagePreview && <Image src={imagePreview} alt="Image preview" width={100} height={100} className="mt-2 rounded-md" />}
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add to Gallery
        </Button>
      </form>
    </Form>
  );
}

