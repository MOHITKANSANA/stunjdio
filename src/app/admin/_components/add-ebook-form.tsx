
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

const ebookSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  thumbnailUrl: z.string().url('Must be a valid URL.'),
  fileUrl: z.string().url('Must be a valid URL.'),
});

type EbookFormValues = z.infer<typeof ebookSchema>;

export function AddEbookForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EbookFormValues>({
    resolver: zodResolver(ebookSchema),
    defaultValues: {
      title: '',
      description: '',
      thumbnailUrl: '',
      fileUrl: '',
    },
  });

  const onSubmit = async (data: EbookFormValues) => {
    setIsLoading(true);
    try {
      await addDoc(collection(firestore, 'ebooks'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Success', description: 'E-book added successfully.' });
      form.reset();
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
        <FormField control={form.control} name="thumbnailUrl" render={({ field }) => (
          <FormItem><FormLabel>Thumbnail URL</FormLabel><FormControl><Input placeholder="https://example.com/thumbnail.jpg" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
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
