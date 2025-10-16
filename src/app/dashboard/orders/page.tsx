'use client';

import { useAuth } from '@/hooks/use-auth';
import { firestore } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function MyOrdersPage() {
    const { user, loading: authLoading } = useAuth();

    // Use Firestore's 'in' operator to query for multiple types at once
    // This avoids needing a composite index for 'enrollmentType' and 'createdAt'
    const enrollmentsQuery = user
        ? query(
            collection(firestore, 'enrollments'),
            where('userId', '==', user.uid),
            where('enrollmentType', 'in', ['Book', 'E-Book', 'Test Series', 'Course', 'Previous Year Paper'])
          )
        : null;

    const [orders, ordersLoading, ordersError] = useCollection(enrollmentsQuery);

    // Client-side sorting
    const sortedOrders = orders?.docs.sort((a, b) => {
        const dateA = a.data().createdAt?.toDate() || 0;
        const dateB = b.data().createdAt?.toDate() || 0;
        return dateB - dateA;
    });

    if (authLoading || ordersLoading) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-4">
                <Skeleton className="h-10 w-1/3" />
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
        );
    }

    if (ordersError) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-8">
                 <Card className="text-center p-8">
                    <CardHeader>
                        <ShoppingCart className="mx-auto h-12 w-12 text-destructive" />
                        <CardTitle className="text-destructive">Error Loading Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">We couldn't load your order history at the moment. Please try again later.</p>
                        <p className="text-xs text-muted-foreground mt-4">{ordersError.message}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!sortedOrders || sortedOrders.length === 0) {
        return (
            <div className="text-center py-12">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">You have no orders</h3>
                <p className="mt-1 text-sm text-muted-foreground">Your book and course purchases will appear here.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-headline">My Orders</h1>
                <p className="text-muted-foreground mt-2">Track the status of your purchases.</p>
            </div>
            <div className="space-y-4">
                {sortedOrders.map(doc => {
                    const order = doc.data();
                    return (
                        <Card key={doc.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{order.courseTitle || 'Item'}</CardTitle>
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
