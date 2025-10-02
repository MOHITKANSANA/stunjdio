
'use client';

import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ManageTestSeriesEnrollments() {
    const { toast } = useToast();

    const [enrollments, loading, error] = useCollection(
        query(collection(firestore, 'enrollments'), where('enrollmentType', '==', 'Test Series'), orderBy('createdAt', 'desc'))
    );

    const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
        try {
            const enrollmentRef = doc(firestore, 'enrollments', id);
            await updateDoc(enrollmentRef, { 
                status,
                processedAt: serverTimestamp(),
            });
            toast({ title: 'Success', description: `Enrollment has been ${status}.` });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update enrollment status.' });
        }
    };

    const renderTable = (status: string) => {
        const filteredEnrollments = enrollments?.docs.filter(doc => doc.data().status === status);

        if (loading) return <Skeleton className="h-48 w-full" />;
        if (!filteredEnrollments || filteredEnrollments.length === 0) {
            return <p className="text-center text-muted-foreground p-8">No {status} enrollments found.</p>;
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Test Series</TableHead>
                        <TableHead>Screenshot</TableHead>
                        <TableHead>{status === 'pending' ? 'Actions' : 'Status'}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredEnrollments.map(enrollmentDoc => {
                        const enrollment = enrollmentDoc.data();
                        return (
                            <TableRow key={enrollmentDoc.id}>
                                <TableCell>
                                    <div>{enrollment.userDisplayName}</div>
                                    <div className="text-xs text-muted-foreground">{enrollment.userEmail}</div>
                                </TableCell>
                                <TableCell>{enrollment.courseTitle}</TableCell>
                                <TableCell>
                                    <a href={enrollment.screenshotDataUrl} target="_blank" rel="noopener noreferrer">
                                        <Image src={enrollment.screenshotDataUrl} alt="Payment Screenshot" width={80} height={80} className="rounded-md object-cover" />
                                    </a>
                                </TableCell>
                                <TableCell>
                                    {status === 'pending' ? (
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleUpdateStatus(enrollmentDoc.id, 'approved')}>Approve</Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(enrollmentDoc.id, 'rejected')}>Reject</Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                             <Badge variant={status === 'approved' ? 'default' : 'destructive'}>{status}</Badge>
                                             {enrollment.processedAt && (
                                                <span className="text-xs text-muted-foreground mt-1">
                                                    {enrollment.processedAt.toDate().toLocaleString()}
                                                </span>
                                             )}
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        );
    }

    return (
        <div>
            {error && <p className="text-destructive">Error: {error.message}</p>}
             <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">{renderTable('pending')}</TabsContent>
                <TabsContent value="approved">{renderTable('approved')}</TabsContent>
                <TabsContent value="rejected">{renderTable('rejected')}</TabsContent>
            </Tabs>
        </div>
    );
}
