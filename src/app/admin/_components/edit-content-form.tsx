'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const editSchema = z.object({
  price: z.coerce.number().min(0, 'Price must be a positive number.'),
  isFree: z.boolean().default(false),
});

type EditFormValues = z.infer<typeof editSchema>;

interface EditContentFormProps {
  collectionName: string;
  docId: string;
  onClose: (wasUpdated: boolean) => void;
}

export function EditContentForm({ collectionName, docId, onClose }: EditContentFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      price: 0,
      isFree: false,
    },
  });

  const isFree = form.watch('isFree');

  useEffect(() => {
    const fetchDoc = async () => {
      setIsFetching(true);
      try {
        const docRef = doc(firestore, collectionName, docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          form.reset({
            price: data.price || 0,
            isFree: data.isFree || false,
          });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch item data.' });
      } finally {
        setIsFetching(false);
      }
    };
    fetchDoc();
  }, [collectionName, docId, form, toast]);

  const onSubmit = async (data: EditFormValues) => {
    setIsLoading(true);
    try {
      const docRef = doc(firestore, collectionName, docId);
      await updateDoc(docRef, {
        price: data.isFree ? 0 : data.price,
        isFree: data.isFree,
      });
      toast({ title: 'Success', description: 'Item updated successfully.' });
      onClose(true);
    } catch (error) {
      console.error('Error updating item:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update item.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isFetching) {
      return <Skeleton className="h-48 w-full" />
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="isFree"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Make this item free</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {!isFree && (
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₹)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onClose(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </div>
      </form>
    </Form>
  );
}
