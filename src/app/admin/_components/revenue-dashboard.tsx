
'use client';

import { useState, useEffect } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { IndianRupee, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const ADMIN_PASSWORD = "ADMIN@123";

export function RevenueDashboard() {
    const [enrollments, loading, error] = useCollection(
        query(collection(firestore, 'enrollments'), orderBy('createdAt', 'desc'))
    );
    const { toast } = useToast();
    const [editingCell, setEditingCell] = useState<{ id: string; price: number } | null>(null);
    const [newPrice, setNewPrice] = useState<string>('');

    const approvedEnrollments = enrollments?.docs.filter(doc => doc.data().status === 'approved') || [];

    const totalRevenue = approvedEnrollments.reduce((acc, doc) => {
        const price = doc.data().finalPrice || 0;
        return acc + price;
    }, 0);

    const munendraShare = totalRevenue * 0.60;
    const mohitShare = totalRevenue * 0.40;

    const handleEditClick = (id: string, price: number) => {
        setEditingCell({ id, price });
        setNewPrice(String(price));
    };

    const handleSavePrice = async (id: string) => {
        const password = prompt('Enter admin password to edit price:');
        if (password !== ADMIN_PASSWORD) {
            toast({ variant: 'destructive', title: 'Incorrect Password' });
            return;
        }

        const price = parseFloat(newPrice);
        if (isNaN(price) || price < 0) {
            toast({ variant: 'destructive', title: 'Invalid Price' });
            return;
        }
        
        try {
            const enrollmentRef = doc(firestore, 'enrollments', id);
            await updateDoc(enrollmentRef, { finalPrice: price });
            toast({ title: 'Success', description: 'Price updated successfully.' });
            setEditingCell(null);
        } catch (err) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update price.' });
        }
    };
    
    const handleCancelEdit = () => {
        setEditingCell(null);
        setNewPrice('');
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold flex items-center"><IndianRupee />{totalRevenue.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Munedra Yadav's Share (60%)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold flex items-center"><IndianRupee />{munendraShare.toFixed(2)}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Mohit Gurjar's Share (40%)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold flex items-center"><IndianRupee />{mohitShare.toFixed(2)}</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Approved Enrollments</CardTitle>
                    <CardDescription>Only approved enrollments contribute to revenue.</CardDescription>
                </CardHeader>
                <CardContent>
                     {error && <p className="text-destructive">Error: {error.message}</p>}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Coupon</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {approvedEnrollments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        No approved enrollments yet.
                                    </TableCell>
                                </TableRow>
                            )}
                            {approvedEnrollments.map(doc => {
                                const enrollment = doc.data();
                                return (
                                    <TableRow key={doc.id}>
                                        <TableCell>{enrollment.userDisplayName}</TableCell>
                                        <TableCell>{enrollment.courseTitle}</TableCell>
                                        <TableCell>{enrollment.createdAt?.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell>{enrollment.couponCode || 'N/A'}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {editingCell?.id === doc.id ? (
                                                <Input 
                                                    type="number" 
                                                    value={newPrice}
                                                    onChange={(e) => setNewPrice(e.target.value)}
                                                    className="h-8 w-24 text-right"
                                                />
                                            ) : (
                                                `₹${(enrollment.finalPrice || 0).toFixed(2)}`
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                             {editingCell?.id === doc.id ? (
                                                <div className="flex gap-1 justify-end">
                                                     <Button variant="ghost" size="icon" onClick={() => handleSavePrice(doc.id)}><Check className="h-4 w-4 text-green-500"/></Button>
                                                     <Button variant="ghost" size="icon" onClick={handleCancelEdit}><X className="h-4 w-4 text-red-500"/></Button>
                                                </div>
                                             ) : (
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(doc.id, enrollment.finalPrice || 0)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                             )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
