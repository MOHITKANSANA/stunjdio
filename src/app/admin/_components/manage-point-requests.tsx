
'use client';

import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { awardExtraPointsAction } from '@/app/actions/kids-tube';

export function ManagePointRequests() {
    const { toast } = useToast();
    const [pointsToAward, setPointsToAward] = useState<{[key: string]: string}>({});

    const [requests, loading, error] = useCollection(
        query(collection(firestore, 'pointRequests'), orderBy('requestedAt', 'desc'))
    );

    const handleAwardPoints = async (requestId: string, userId: string) => {
        const points = parseInt(pointsToAward[requestId] || '0', 10);
        if (points <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Points', description: 'Please enter a positive number of points.' });
            return;
        }

        const result = await awardExtraPointsAction(requestId, userId, points);
        if (result.success) {
            toast({ title: 'Success!', description: result.message });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };
    
    const handlePointsChange = (requestId: string, value: string) => {
        setPointsToAward(prev => ({ ...prev, [requestId]: value }));
    }

    const renderTable = (status: 'pending' | 'awarded') => {
        const filteredRequests = requests?.docs.filter(doc => doc.data().status === status);

        if (loading) return <Skeleton className="h-48 w-full" />;
        if (!filteredRequests || filteredRequests.length === 0) {
            return <p className="text-center text-muted-foreground p-8">No {status} requests found.</p>;
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Requested At</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredRequests.map(requestDoc => {
                        const request = requestDoc.data();
                        return (
                            <TableRow key={requestDoc.id}>
                                <TableCell>
                                    <div>{request.userName}</div>
                                    <div className="text-xs text-muted-foreground">{request.userEmail}</div>
                                </TableCell>
                                <TableCell>{request.requestedAt.toDate().toLocaleString()}</TableCell>
                                <TableCell className="space-y-2 md:space-y-0 md:space-x-2">
                                    {status === 'pending' ? (
                                        <div className="flex flex-col sm:flex-row gap-2 items-center">
                                            <Input 
                                                type="number" 
                                                placeholder="Points" 
                                                className="w-24"
                                                value={pointsToAward[requestDoc.id] || ''}
                                                onChange={(e) => handlePointsChange(requestDoc.id, e.target.value)}
                                            />
                                            <Button size="sm" onClick={() => handleAwardPoints(requestDoc.id, request.userId)}>
                                                Award Points
                                            </Button>
                                        </div>
                                    ) : (
                                         <Badge>{request.pointsAwarded} points awarded</Badge>
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
                    <TabsTrigger value="awarded">Awarded</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">{renderTable('pending')}</TabsContent>
                <TabsContent value="awarded">{renderTable('awarded')}</TabsContent>
            </Tabs>
        </div>
    );
}
