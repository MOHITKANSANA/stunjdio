'use client';

import { useState } from 'react';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc, updateDoc, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const BookShalaSettings = () => {
    const { toast } = useToast();
    const [settingsDoc, settingsLoading] = useDocumentData(doc(firestore, 'settings', 'bookShala'));
    const [verificationFee, setVerificationFee] = useState(settingsDoc?.verificationFee || '5');
    const [commission, setCommission] = useState(settingsDoc?.commission || '5');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await setDoc(doc(firestore, 'settings', 'bookShala'), {
                verificationFee: Number(verificationFee),
                commission: Number(commission),
            }, { merge: true });
            toast({ title: 'Settings saved!' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving settings.' });
        }
        setIsSaving(false);
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Book Shala Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Verification Fee (₹)</Label>
                    <Input type="number" value={verificationFee} onChange={(e) => setVerificationFee(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label>Commission per Book (₹)</Label>
                    <Input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} />
                </div>
                 <Button onClick={handleSave} disabled={isSaving}>
                     {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Save Settings
                 </Button>
            </CardContent>
        </Card>
    )
}

export function ManageBookShalaOrders() {
    const { toast } = useToast();

    const [orders, loading, error] = useCollection(
        query(collection(firestore, 'bookShalaOrders'), orderBy('createdAt', 'desc'))
    );

    const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected' | 'shipped') => {
        try {
            const orderRef = doc(firestore, 'bookShalaOrders', id);
            await updateDoc(orderRef, { status });
            toast({ title: 'Success', description: `Order status updated to ${status}.` });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update order status.' });
        }
    };

    const renderTable = (status: string) => {
        const filteredOrders = orders?.docs.filter(doc => doc.data().status === status);

        if (loading) return <Skeleton className="h-48 w-full" />;
        if (!filteredOrders || filteredOrders.length === 0) {
            return <p className="text-center text-muted-foreground p-8">No {status} orders found.</p>;
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Book</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredOrders.map(orderDoc => {
                        const order = orderDoc.data();
                        return (
                            <TableRow key={orderDoc.id}>
                                <TableCell>
                                    <div>{order.userName}</div>
                                    <div className="text-xs text-muted-foreground">{order.userEmail}</div>
                                </TableCell>
                                <TableCell>{order.bookTitle}</TableCell>
                                 <TableCell className="text-xs">
                                     {order.address.line1}, {order.address.line2 && `${order.address.line2}, `}
                                     {order.address.city}, {order.address.state} - {order.address.postalCode}
                                     <br/>Ph: {order.address.phone}
                                </TableCell>
                                <TableCell>
                                    {status === 'pending_verification' && (
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleUpdateStatus(orderDoc.id, 'approved')}>Approve</Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(orderDoc.id, 'rejected')}>Reject</Button>
                                        </div>
                                    )}
                                     {status === 'approved' && (
                                        <Button size="sm" onClick={() => handleUpdateStatus(orderDoc.id, 'shipped')}>Mark as Shipped</Button>
                                     )}
                                     {status === 'shipped' && <Badge>Shipped</Badge>}
                                      {status === 'rejected' && <Badge variant="destructive">Rejected</Badge>}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        );
    }

    return (
        <div className="space-y-6">
            <BookShalaSettings />
            {error && <p className="text-destructive">Error: {error.message}</p>}
             <Tabs defaultValue="pending_verification">
                <TabsList>
                    <TabsTrigger value="pending_verification">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="shipped">Shipped</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
                <TabsContent value="pending_verification">{renderTable('pending_verification')}</TabsContent>
                <TabsContent value="approved">{renderTable('approved')}</TabsContent>
                <TabsContent value="shipped">{renderTable('shipped')}</TabsContent>
                <TabsContent value="rejected">{renderTable('rejected')}</TabsContent>
            </Tabs>
        </div>
    );
}