
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { sendNotificationsAction } from '@/app/actions/notifications';

const notificationSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  message: z.string().min(1, 'Message is required.'),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export function SendNotificationsForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      message: '',
    },
  });

  const onSubmit = async (data: NotificationFormValues) => {
    setIsLoading(true);
    try {
      const result = await sendNotificationsAction(data.title, data.message);
      if (result.success) {
        toast({ title: 'Success', description: `Notifications sent to ${result.successCount} device(s).` });
        form.reset();
      } else {
        throw new Error(result.error || 'Failed to send notifications.');
      }
    } catch (error: any) {
      console.error('Error sending notifications:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
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
              <FormLabel>Notification Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., New Course Alert!" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notification Message</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the new update..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Notification
        </Button>
      </form>
    </Form>
  );
}
