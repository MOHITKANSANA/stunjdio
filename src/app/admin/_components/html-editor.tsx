
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const htmlPageSchema = z.object({
  pageSlug: z.string().min(3, 'Slug must be at least 3 characters.').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens.'),
  htmlContent: z.string().min(1, 'HTML content cannot be empty.'),
});

type HtmlPageFormValues = z.infer<typeof htmlPageSchema>;

export function HtmlEditor() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');

  const form = useForm<HtmlPageFormValues>({
    resolver: zodResolver(htmlPageSchema),
    defaultValues: {
      pageSlug: '',
      htmlContent: '',
    },
  });

  const onSubmit = async (data: HtmlPageFormValues) => {
    setIsLoading(true);
    setGeneratedUrl('');
    try {
      const pageRef = doc(firestore, 'htmlPages', data.pageSlug);
      await setDoc(pageRef, {
        slug: data.pageSlug,
        content: data.htmlContent,
      });

      const url = `/p/${data.pageSlug}`;
      setGeneratedUrl(url);
      toast({ 
        title: 'Page Saved!', 
        description: (
          <p>
            Your page is available at{' '}
            <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
              {url}
            </a>
          </p>
        ),
      });
      // Optionally reset form
      // form.reset();
    } catch (error) {
      console.error('Error saving page:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save the HTML page.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom HTML Page Editor</CardTitle>
        <CardDescription>
          Create a new page by providing a URL slug and its HTML content. The new page will be available at `/p/[your-slug]`.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="pageSlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Page Slug</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                        <span className="text-muted-foreground p-2 bg-muted border rounded-lmd">/p/</span>
                        <Input {...field} placeholder="about-us" className="rounded-l-none"/>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="htmlContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HTML Content</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="<html>...</html>"
                      className="min-h-[400px] font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Page
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    