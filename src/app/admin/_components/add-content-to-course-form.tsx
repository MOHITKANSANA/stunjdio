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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection } from 'react-firebase-hooks/firestore';

const contentSchema = z.object({
  courseId: z.string().min(1, 'Please select a course.'),
  type: z.enum(['video', 'pdf', 'note', 'test_series']),
  title: z.string().min(1, 'Title is required.'),
  url: z.string().optional(),
  testSeriesId: z.string().optional(),
  introduction: z.string().optional(),
}).refine(data => {
    if (data.type === 'test_series' && !data.testSeriesId) {
        return false;
    }
    // URL is optional for test series, required for others
    if (data.type !== 'test_series' && !data.url) {
        return false;
    }
    return true;
}, {
    message: 'URL or Test Series ID is required based on type.',
    path: ['url'], // You can point to one of the fields
});

type ContentFormValues = z.infer<typeof contentSchema>;

export function AddContentToCourseForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [coursesCollection, coursesLoading] = useCollection(collection(firestore, 'courses'));
  const [testSeriesCollection, testSeriesLoading] = useCollection(collection(firestore, 'testSeries'));

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      courseId: '',
      type: 'video',
      title: '',
      url: '',
      testSeriesId: '',
      introduction: '',
    },
  });

  const contentType = form.watch('type');

  const onSubmit = async (data: ContentFormValues) => {
    setIsLoading(true);
    try {
      await addDoc(collection(firestore, 'courses', data.courseId, 'content'), {
        type: data.type,
        title: data.title,
        url: data.url,
        testSeriesId: data.testSeriesId,
        introduction: data.introduction,
        createdAt: serverTimestamp()
      });

      toast({ title: 'Success', description: 'Content added to course successfully.' });
      form.reset();
    } catch (error) {
      console.error('Error adding content:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add content.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="courseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Course</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course to add content to" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                    {coursesLoading && <p className="p-2">Loading courses...</p>}
                    {coursesCollection?.docs.map(doc => (
                        <SelectItem key={doc.id} value={doc.id}>
                            {doc.data().title}
                        </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="test_series">Test Series</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content Title</FormLabel>
              <FormControl><Input {...field} placeholder="e.g., Chapter 1: Introduction" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {contentType === 'test_series' ? (
           <FormField
            control={form.control}
            name="testSeriesId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Select Test Series</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a test series" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {testSeriesLoading && <p className="p-2">Loading tests...</p>}
                        {testSeriesCollection?.docs.map(doc => (
                            <SelectItem key={doc.id} value={doc.id}>
                                {doc.data().title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        ) : (
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content URL</FormLabel>
                <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="introduction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Introduction (Optional)</FormLabel>
              <FormControl><Textarea {...field} placeholder="A short description of the content" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading || coursesLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Content
        </Button>
      </form>
    </Form>
  );
}
