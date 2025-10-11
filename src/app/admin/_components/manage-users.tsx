
'use client';

import { useState, useEffect } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function ManageUsers() {
  const [users, usersLoading] = useCollection(query(collection(firestore, 'users'), orderBy('createdAt', 'desc')));
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users?.docs.filter(doc => {
      const data = doc.data();
      const name = data.displayName?.toLowerCase() || '';
      const email = data.email?.toLowerCase() || '';
      return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Users</CardTitle>
        <CardDescription>View and manage all registered users.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Input 
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="border rounded-lg overflow-hidden">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Class/Exam</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {usersLoading && (
                    <TableRow>
                        <TableCell colSpan={4}>
                            <Skeleton className="h-24 w-full" />
                        </TableCell>
                    </TableRow>
                )}
                {filteredUsers?.map((doc) => {
                    const user = doc.data();
                    return (
                        <TableRow key={doc.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={user.photoURL} />
                                    <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{user.displayName}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <p>{user.phone}</p>
                            </TableCell>
                            <TableCell>
                                <p>{user.district}, {user.state}</p>
                            </TableCell>
                            <TableCell>
                                <p>{user.classOrExam}</p>
                            </TableCell>
                        </TableRow>
                    )
                })}
                 {filteredUsers && filteredUsers.length === 0 && !usersLoading && (
                     <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No users found.
                        </TableCell>
                    </TableRow>
                 )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
