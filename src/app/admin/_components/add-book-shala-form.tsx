'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Loader2, Upload } from 'lucide-react';
import Image from 'next/image';

const bookShalaSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  author: z.string().optional(),
  thumbnailFile: z.any().refine(file => file, 'Thumbnail is required.'),
  price: z.coerce.number().min(0).default(0),
});

type BookFormValues = z.infer<typeof bookShalaSchema>;

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function AddBookShalaForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookShalaSchema),
    defaultValues: {
      title: '',
      description: '',
      author: '',
      price: 0,
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      form.setValue('thumbnailFile', file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: BookFormValues) => {
    setIsLoading(true);
    try {
      const thumbnailUrl = await fileToDataUrl(data.thumbnailFile);
      
      await addDoc(collection(firestore, 'bookShala'), {
        title: data.title,
        description: data.description,
        author: data.author,
        thumbnailUrl: thumbnailUrl,
        price: data.price,
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Success', description: 'Book added to Book Shala successfully.' });
      form.reset();
      setImagePreview(null);
    } catch (error) {
      console.error('Error adding book:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add book.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Book Title</FormLabel><FormControl><Input placeholder="e.g., The Psychology of Money" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="author" render={({ field }) => (
            <FormItem><FormLabel>Author</FormLabel><FormControl><Input placeholder="e.g., Morgan Housel" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Short description of the book" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <FormField
          control={form.control}
          name="thumbnailFile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Book Cover Image</FormLabel>
               <FormDescription>Recommended size: 600x800 pixels (portrait).</FormDescription>
              <FormControl>
                <div>
                  <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    {imagePreview ? 'Change Image' : 'Upload Cover'}
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
              {imagePreview && <Image src={imagePreview} alt="Thumbnail preview" width={100} height={150} className="mt-2 rounded-md object-contain" />}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem><FormLabel>Price (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Book
        </Button>
      </form>
    </Form>
  );
}