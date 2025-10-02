
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const contentSchema = z.object({
  type: z.enum(['video', 'pdf', 'note', 'test_series']),
  title: z.string().min(1, 'Title is required.'),
  url: z.string().optional(),
  testSeriesId: z.string().optional(),
  introduction: z.string().optional(),
});

const courseSchema = z.object({
  title: z.string().min(3, 'Title is required.'),
  category: z.string().min(3, 'Category is required.'),
  description: z.string().min(10, 'Description is required.'),
  price: z.coerce.number().min(0, 'Price must be a positive number.'),
  validity: z.coerce.number().min(1, 'Validity must be at least 1 day.'),
  imageUrl: z.string().url('Must be a valid URL.'),
  isFree: z.boolean().default(false),
  content: z.array(contentSchema).optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

export function AddCourseForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      category: '',
      description: '',
      price: 0,
      validity: 365,
      imageUrl: '',
      isFree: false,
      content: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "content"
  });

  const onSubmit = async (data: CourseFormValues) => {
    setIsLoading(true);
    try {
      const courseCollection = collection(firestore, 'courses');
      const courseRef = await addDoc(courseCollection, {
        title: data.title,
        category: data.category,
        description: data.description,
        price: data.price,
        validity: data.validity,
        imageUrl: data.imageUrl,
        isFree: data.isFree,
        createdAt: serverTimestamp(),
      });

      if (data.content && data.content.length > 0) {
        for (const contentItem of data.content) {
            await addDoc(collection(firestore, 'courses', courseRef.id, 'content'), {
                ...contentItem,
                createdAt: serverTimestamp()
            });
        }
      }

      toast({ title: 'Success', description: 'Course added successfully.' });
      form.reset();
    } catch (error) {
      console.error('Error adding course:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add course.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Course Details */}
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Complete UPSC Preparation" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g., UPSC" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Detailed course description..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="validity" render={({ field }) => (
            <FormItem><FormLabel>Validity (days)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="imageUrl" render={({ field }) => (
          <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input placeholder="https://example.com/image.jpg" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="isFree" render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none">
                    <FormLabel>Is this a free course?</FormLabel>
                </div>
            </FormItem>
        )} />


        {/* Dynamic Content Fields */}
        <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold">Course Content</h3>
            {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                    <FormField control={form.control} name={`content.${index}.type`} render={({ field }) => (
                        <FormItem><FormLabel>Type</FormLabel><FormControl>
                           <select {...field} className="w-full p-2 border rounded">
                                <option value="video">Video</option>
                                <option value="pdf">PDF</option>
                                <option value="note">Note</option>
                                <option value="test_series">Test Series</option>
                           </select>
                        </FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name={`content.${index}.title`} render={({ field }) => (
                        <FormItem><FormLabel>Content Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    {form.watch(`content.${index}.type`) === 'test_series' ? (
                         <FormField control={form.control} name={`content.${index}.testSeriesId`} render={({ field }) => (
                            <FormItem><FormLabel>Test Series ID</FormLabel><FormControl><Input placeholder="Enter Firestore Test Series ID" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    ) : (
                         <FormField control={form.control} name={`content.${index}.url`} render={({ field }) => (
                            <FormItem><FormLabel>URL</FormLabel><FormControl><Input placeholder="http://..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    )}
                     <FormField control={form.control} name={`content.${index}.introduction`} render={({ field }) => (
                        <FormItem><FormLabel>Introduction (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 h-7 w-7"><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
             <Button type="button" variant="outline" onClick={() => append({ type: 'video', title: '' })}><PlusCircle className="mr-2"/>Add Content Item</Button>
        </div>
        
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Course
        </Button>
      </form>
    </Form>
  );
}
