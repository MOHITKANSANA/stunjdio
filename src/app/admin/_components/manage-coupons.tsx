
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCollection } from 'react-firebase-hooks/firestore';
import { DatePicker } from './date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const couponSchema = z.object({
  code: z.string().min(4, 'Code must be at least 4 characters.').transform(val => val.toUpperCase()),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().min(1, 'Discount value must be at least 1.'),
  expiryDate: z.date(),
  courseId: z.string().min(1, 'Please select a course or test series.'),
  maxUses: z.coerce.number().min(1, 'Max uses must be at least 1').optional(),
});

type CouponFormValues = z.infer<typeof couponSchema>;

export function ManageCoupons() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [coursesCollection, coursesLoading] = useCollection(collection(firestore, 'courses'));
  const [testSeriesCollection, testSeriesLoading] = useCollection(collection(firestore, 'testSeries'));

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      discountType: 'percentage',
    },
  });
  
  const [expiryTime, setExpiryTime] = useState('23:59');

  const onSubmit = async (data: CouponFormValues) => {
    setIsLoading(true);
    try {
      const [hours, minutes] = expiryTime.split(':').map(Number);
      const finalExpiryDate = new Date(data.expiryDate);
      finalExpiryDate.setHours(hours, minutes);

      await addDoc(collection(firestore, 'coupons'), {
        ...data,
        expiryDate: finalExpiryDate,
        isActive: true,
        uses: 0,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Success', description: 'Coupon created successfully.' });
      form.reset();
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create coupon.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const allItems = [
    ...(coursesCollection?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []),
    ...(testSeriesCollection?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [])
  ].sort((a,b) => a.title.localeCompare(b.title));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Coupon</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField control={form.control} name="courseId" render={({ field }) => (
                <FormItem>
                    <FormLabel>Applicable To</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course or test series" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                             {coursesLoading || testSeriesLoading ? (
                                <p className="p-2">Loading items...</p>
                             ) : (
                                allItems.map(item => (
                                    <SelectItem key={item.id} value={item.id}>
                                        {item.title}
                                    </SelectItem>
                                ))
                             )}
                        </SelectContent>
                      </Select>
                    <FormMessage />
                </FormItem>
             )} />
            <FormField control={form.control} name="code" render={({ field }) => (
              <FormItem><FormLabel>Coupon Code</FormLabel><FormControl><Input placeholder="e.g., SAVE10" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="discountType" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Discount Type</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="discountValue" render={({ field }) => (
                  <FormItem><FormLabel>Discount Value</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="expiryDate" render={({ field }) => (
                    <FormItem><FormLabel>Expiry Date</FormLabel><FormControl><DatePicker date={field.value} setDate={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormItem>
                    <FormLabel>Expiry Time</FormLabel>
                    <Input type="time" value={expiryTime} onChange={e => setExpiryTime(e.target.value)} />
                </FormItem>
            </div>
             <FormField control={form.control} name="maxUses" render={({ field }) => (
              <FormItem><FormLabel>Maximum Uses (Optional)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Coupon
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
