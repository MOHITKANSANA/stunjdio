
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Loader2, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

const promotionSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  url: z.string().url('A valid URL is required.'),
});

type PromotionFormValues = z.infer<typeof promotionSchema>;

const ExistingPromotions = () => {
    const { toast } = useToast();
    const [promotions, setPromotions] = useState<any[]>([]);

    useEffect(() => {
        const q = query(collection(firestore, "promotions"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPromotions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this promotion?")) {
            try {
                await deleteDoc(doc(firestore, 'promotions', id));
                toast({ title: "Promotion Deleted" });
            } catch (error: any) {
                toast({ variant: 'destructive', title: "Error", description: error.message });
            }
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Current Promotions</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {promotions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">
                                    No promotions added yet.
                                </TableCell>
                            </TableRow>
                        )}
                        {promotions.map((promo) => (
                            <TableRow key={promo.id}>
                                <TableCell className="font-medium">
                                    <Link href={promo.url} target="_blank" className="hover:underline">
                                        {promo.title}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(promo.id)}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export function ManagePromotions() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      title: '',
      url: '',
    },
  });

  const onSubmit = async (data: PromotionFormValues) => {
    setIsLoading(true);
    try {
      await addDoc(collection(firestore, 'promotions'), {
        ...data,
        createdAt: new Date(),
      });
      toast({ title: 'Success', description: 'New promotion has been added.' });
      form.reset();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
        <Card>
            <CardHeader><CardTitle>Add New Promotion</CardTitle></CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Check out our new YouTube channel!" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="url" render={({ field }) => (
                            <FormItem><FormLabel>URL (Link)</FormLabel><FormControl><Input placeholder="https://youtube.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Promotion
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
        <ExistingPromotions />
    </div>
  );
}
