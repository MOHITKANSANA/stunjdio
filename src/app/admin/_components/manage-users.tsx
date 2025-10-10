
'use client';

import { useState, useEffect } from 'react';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { collection, query, where, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, Star, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function ManageUsers() {
  const { toast } = useToast();
  const [users] = useCollection(collection(firestore, 'users'));
  
  const [topStudentsDoc, topStudentsLoading] = useDocumentData(doc(firestore, 'settings', 'topStudents'));
  const topStudentUids = topStudentsDoc?.uids || [];
  
  const [selectedUser, setSelectedUser] = useState('');

  const handleAddTopStudent = async () => {
    if (!selectedUser || topStudentUids.includes(selectedUser)) {
      toast({ variant: 'destructive', description: 'Please select a user or user is already a top student.' });
      return;
    }
    try {
      // Use setDoc with merge to create the document if it doesn't exist
      await setDoc(doc(firestore, 'settings', 'topStudents'), {
        uids: arrayUnion(selectedUser)
      }, { merge: true });
      toast({ description: 'User added to top students.' });
      setSelectedUser('');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleRemoveTopStudent = async (uid: string) => {
    try {
      await updateDoc(doc(firestore, 'settings', 'topStudents'), {
        uids: arrayRemove(uid)
      });
      toast({ description: 'User removed from top students.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const getTopStudentDetails = () => {
    if (!users) return [];
    return topStudentUids.map((uid: string) => {
        const userDoc = users.docs.find(doc => doc.id === uid);
        return userDoc ? {id: userDoc.id, ...userDoc.data()} : null;
    }).filter(Boolean);
  };
  
  const availableUsers = users?.docs.filter(doc => !topStudentUids.includes(doc.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Top Students</CardTitle>
        <CardDescription>Add or remove students from the "Top 10 Students of the Week" list on the dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
            <h3 className="font-semibold mb-2">Add a Top Student</h3>
             <div className="flex gap-2">
                <Select onValueChange={setSelectedUser} value={selectedUser}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a user to add" />
                    </SelectTrigger>
                    <SelectContent>
                        {users?.docs.length === 0 && <p className="p-2">Loading users...</p>}
                        {availableUsers?.map(doc => (
                            <SelectItem key={doc.id} value={doc.id}>
                               {doc.data().displayName} ({doc.data().email})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button onClick={handleAddTopStudent}><PlusCircle className="mr-2" /> Add</Button>
            </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Current Top Students</h3>
          {topStudentsLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : getTopStudentDetails().length === 0 ? (
            <p className="text-muted-foreground text-center p-4 border rounded-md">No top students selected yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getTopStudentDetails().map((student: any) => (
                  <TableRow key={student.uid || student.id}>
                    <TableCell className="flex items-center gap-3">
                       <Avatar>
                          <AvatarImage src={student.photoURL} />
                          <AvatarFallback>{student.displayName?.charAt(0) || 'S'}</AvatarFallback>
                       </Avatar>
                       <div>
                          <p className="font-medium">{student.displayName}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                       </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="destructive" size="icon" onClick={() => handleRemoveTopStudent(student.uid || student.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
