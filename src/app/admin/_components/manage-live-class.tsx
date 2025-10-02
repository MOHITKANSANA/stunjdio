
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const liveClassSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  thumbnailUrl: z.string().url('Must be a valid URL.'),
  videoUrl: z.string().url('Must be a valid URL.'),
  startTime: z.date({ required_error: 'A start date and time is required.' }),
});

type LiveClassFormValues = z.infer<typeof liveClassSchema>;

export function ManageLiveClass() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LiveClassFormValues>({
    resolver: zodResolver(liveClassSchema),
    defaultValues: {
      title: '',
      thumbnailUrl: '',
      videoUrl: '',
    },
  });

  const onSubmit = async (data: LiveClassFormValues) => {
    setIsLoading(true);
    try {
      await addDoc(collection(firestore, 'live_classes'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Success', description: 'Live class added successfully.' });
      form.reset();
    } catch (error) {
      console.error('Error adding live class:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add live class.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Advanced Calculus Session" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="thumbnailUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thumbnail URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/thumbnail.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="videoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video URL (YouTube, Zoho, Google Drive, etc.)</FormLabel>
              <FormControl>
                <Input placeholder="https://youtube.com/live/..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Start Date and Time</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP HH:mm')
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                  <div className="p-3 border-t border-border">
                     <Input
                        type="time"
                        onChange={(e) => {
                            const newDate = field.value || new Date();
                            const [hours, minutes] = e.target.value.split(':');
                            newDate.setHours(parseInt(hours), parseInt(minutes));
                            field.onChange(newDate);
                        }}
                     />
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Live Class
        </Button>
      </form>
    </Form>
  );
}
