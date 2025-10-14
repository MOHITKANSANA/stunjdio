'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const paperSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  year: z.coerce.number().min(2000, 'Year must be after 2000.'),
  fileUrl: z.string().url('Must be a valid URL.'),
  price: z.coerce.number().min(0).default(0),
  isFree: z.boolean().default(false),
});

type PaperFormValues = z.infer<typeof paperSchema>;

export function AddPaperForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PaperFormValues>({
    resolver: zodResolver(paperSchema),
    defaultValues: {
      title: '',
      year: new Date().getFullYear(),
      fileUrl: '',
      price: 0,
      isFree: true,
    },
  });
  
  const isFree = form.watch('isFree');

  const onSubmit = async (data: PaperFormValues) => {
    setIsLoading(true);
    try {
      await addDoc(collection(firestore, 'previousPapers'), {
        ...data,
        price: data.isFree ? 0 : data.price,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Success', description: 'Previous year paper added successfully.' });
      form.reset();
    } catch (error) {
      console.error('Error adding paper:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add paper.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Paper Title</FormLabel><FormControl><Input placeholder="e.g., UPSC Prelims Paper 1" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="year" render={({ field }) => (
          <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" placeholder="e.g., 2023" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="fileUrl" render={({ field }) => (
          <FormItem><FormLabel>PDF File URL</FormLabel><FormControl><Input placeholder="https://example.com/paper.pdf" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <FormField control={form.control} name="isFree" render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none">
                    <FormLabel>Is this a free paper?</FormLabel>
                </div>
            </FormItem>
        )} />

        {!isFree && (
            <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem><FormLabel>Price (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        )}

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Paper
        </Button>
      </form>
    </Form>
  );
}
