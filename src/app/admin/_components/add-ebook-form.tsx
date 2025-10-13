
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

const ebookSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  fileUrl: z.string().url('Must be a valid PDF URL.'),
  thumbnailFile: z.any().refine(file => file, 'Thumbnail is required.'),
});

type EbookFormValues = z.infer<typeof ebookSchema>;

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function AddEbookForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<EbookFormValues>({
    resolver: zodResolver(ebookSchema),
    defaultValues: {
      title: '',
      description: '',
      fileUrl: '',
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      form.setValue('thumbnailFile', file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: EbookFormValues) => {
    setIsLoading(true);
    try {
      const thumbnailUrl = await fileToDataUrl(data.thumbnailFile);
      
      await addDoc(collection(firestore, 'ebooks'), {
        title: data.title,
        description: data.description,
        fileUrl: data.fileUrl,
        thumbnailUrl: thumbnailUrl,
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Success', description: 'E-book added successfully.' });
      form.reset();
      setImagePreview(null);
    } catch (error) {
      console.error('Error adding e-book:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add e-book.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Indian History" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Short description of the e-book" {...field} /></FormControl><FormMessage /></FormItem>
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

        <FormField control={form.control} name="fileUrl" render={({ field }) => (
          <FormItem><FormLabel>PDF File URL</FormLabel><FormControl><Input placeholder="https://example.com/ebook.pdf" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add E-book
        </Button>
      </form>
    </Form>
  );
}
