
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, onSnapshot, collection, query, orderBy, deleteDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Loader2, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const pageSchema = z.object({
  pageSlug: z.string().min(3, 'Slug must be at least 3 characters.').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens.'),
  contentType: z.enum(['html', 'json']),
  htmlContent: z.string().optional(),
  jsonContent: z.string().optional(),
}).refine(data => {
    if (data.contentType === 'html') return !!data.htmlContent;
    if (data.contentType === 'json') {
        try {
            JSON.parse(data.jsonContent || '');
            return true;
        } catch {
            return false;
        }
    }
    return false;
}, {
    message: "Content is required and JSON must be valid.",
    path: ['htmlContent'], // Point error to one field
});

type PageFormValues = z.infer<typeof pageSchema>;

const ExistingPages = () => {
    const { toast } = useToast();
    const [pages, setPages] = useState<any[]>([]);

    useEffect(() => {
        const q = query(collection(firestore, "htmlPages"), orderBy("slug"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (slug: string) => {
        if (window.confirm(`Are you sure you want to delete the page "/p/${slug}"? This action cannot be undone.`)) {
            try {
                await deleteDoc(doc(firestore, 'htmlPages', slug));
                toast({ title: "Page Deleted", description: `The page /p/${slug} has been deleted.` });
            } catch (error: any) {
                toast({ variant: 'destructive', title: "Error", description: error.message });
            }
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Existing Pages</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Slug</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pages.map(page => (
                            <TableRow key={page.id}>
                                <TableCell><Link href={`/p/${page.id}`} target="_blank" className="text-primary hover:underline">/p/{page.id}</Link></TableCell>
                                <TableCell>{page.type}</TableCell>
                                <TableCell>
                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(page.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 {pages.length === 0 && <p className="text-muted-foreground text-center p-4">No custom pages created yet.</p>}
            </CardContent>
        </Card>
    )
}

export function HtmlEditor() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      pageSlug: '',
      contentType: 'html',
      htmlContent: '',
      jsonContent: '',
    },
  });

  const contentType = form.watch('contentType');

  const onSubmit = async (data: PageFormValues) => {
    setIsLoading(true);
    try {
      const pageRef = doc(firestore, 'htmlPages', data.pageSlug);
      
      const contentToSave = data.contentType === 'html' ? data.htmlContent : data.jsonContent;
      
      await setDoc(pageRef, {
        slug: data.pageSlug,
        content: contentToSave,
        type: data.contentType,
      });
      
      toast({ 
        title: 'Page Saved!', 
        description: (
          <p>
            Your page is available at{' '}
            <a href={`/p/${data.pageSlug}`} target="_blank" rel="noopener noreferrer" className="underline">
              /p/{data.pageSlug}
            </a>
          </p>
        ),
      });
      form.reset();
    } catch (error) {
      console.error('Error saving page:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save the page.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
        <Card>
        <CardHeader>
            <CardTitle>Custom Page Editor</CardTitle>
            <CardDescription>
            Create a new page by providing a URL slug and its HTML or JSON content.
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
                            <span className="text-muted-foreground p-2 bg-muted border rounded-l-md">/p/</span>
                            <Input {...field} placeholder="about-us" className="rounded-l-none"/>
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Tabs defaultValue={field.value} onValueChange={(value) => field.onChange(value as 'html' | 'json')} className="w-full">
                            <TabsList>
                                <TabsTrigger value="html">HTML</TabsTrigger>
                                <TabsTrigger value="json">JSON</TabsTrigger>
                            </TabsList>
                    </Tabs>
                    <FormMessage />
                    </FormItem>
                )}
                />

                {contentType === 'html' ? (
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
                ) : (
                    <FormField
                        control={form.control}
                        name="jsonContent"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>JSON Content</FormLabel>
                            <FormControl>
                                <Textarea
                                {...field}
                                placeholder='{ "title": "My Page", "data": [] }'
                                className="min-h-[400px] font-mono"
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                
                <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Page
                </Button>
            </form>
            </Form>
        </CardContent>
        </Card>

        <ExistingPages />
    </div>
  );
}
