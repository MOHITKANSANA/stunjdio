'use client';

import { useAuth } from '@/hooks/use-auth';
import { firestore } from '@/lib/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function MyOrdersPage() {
    const { user, loading: authLoading } = useAuth();

    const enrollmentsQuery = user
        ? query(
            collection(firestore, 'enrollments'),
            where('userId', '==', user.uid),
            where('enrollmentType', '==', 'Book'), // Assuming book orders are of this type
            orderBy('createdAt', 'desc')
          )
        : null;

    const [orders, ordersLoading, ordersError] = useCollection(enrollmentsQuery);

    if (authLoading || ordersLoading) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-4">
                <Skeleton className="h-10 w-1/3" />
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
        );
    }

    if (ordersError) {
        return <p className="text-destructive p-4">Error loading your orders.</p>;
    }

    if (!orders || orders.empty) {
        return (
            <div className="text-center py-12">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">You have no orders</h3>
                <p className="mt-1 text-sm text-muted-foreground">Your book orders will appear here.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-headline">My Orders</h1>
                <p className="text-muted-foreground mt-2">Track the status of your book purchases.</p>
            </div>
            <div className="space-y-4">
                {orders.docs.map(doc => {
                    const order = doc.data();
                    return (
                        <Card key={doc.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{order.courseTitle}</CardTitle>
                                        <CardDescription>
                                            Order Date: {order.createdAt?.toDate().toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={order.status === 'approved' || order.status === 'shipped' ? 'default' : (order.status === 'rejected' ? 'destructive' : 'secondary')}>
                                        {order.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            {order.trackingDetails && (
                                <CardContent>
                                     <Accordion type="single" collapsible>
                                        <AccordionItem value="item-1">
                                            <AccordionTrigger>
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-5 w-5 text-primary" />
                                                    Tracking Details
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <p><strong>Estimated Delivery:</strong> {order.trackingDetails.deliveryDate}</p>
                                                <p><strong>Tracking Link:</strong> <a href={order.trackingDetails.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{order.trackingDetails.trackingUrl}</a></p>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </CardContent>
                            )}
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}
