
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
import { PlusCircle, Star, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function ManageUsers() {
  const { toast } = useToast();
  const [users, usersLoading] = useCollection(collection(firestore, 'users'));
  
  const [topStudentsDoc, topStudentsLoading] = useDocumentData(doc(firestore, 'settings', 'topStudents'));
  const [topStudentUids, setTopStudentUids] = useState<string[]>([]);
  
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    if (topStudentsDoc) {
      setTopStudentUids(topStudentsDoc.uids || []);
    }
  }, [topStudentsDoc]);

  const handleAddTopStudent = async () => {
    if (!selectedUser) {
      toast({ variant: 'destructive', description: 'Please select a user to add.' });
      return;
    }
    if (topStudentUids.includes(selectedUser)) {
       toast({ variant: 'destructive', description: 'This user is already a top student.' });
       return;
    }
    if (topStudentUids.length >= 10) {
        toast({ variant: 'destructive', description: 'You can only have 10 top students.' });
        return;
    }

    try {
      const newUids = [...topStudentUids, selectedUser];
      await setDoc(doc(firestore, 'settings', 'topStudents'), { uids: newUids }, { merge: true });
      toast({ description: 'User added to top students.' });
      setSelectedUser('');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleRemoveTopStudent = async (uid: string) => {
    try {
      const newUids = topStudentUids.filter(id => id !== uid);
      await setDoc(doc(firestore, 'settings', 'topStudents'), { uids: newUids }, { merge: true });
      toast({ description: 'User removed from top students.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };


  const moveStudent = async (index: number, direction: 'up' | 'down') => {
    const newUids = [...topStudentUids];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newUids.length) return;

    // Swap elements
    [newUids[index], newUids[targetIndex]] = [newUids[targetIndex], newUids[index]];

    try {
        await setDoc(doc(firestore, 'settings', 'topStudents'), { uids: newUids }, { merge: true });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not reorder students.' });
    }
  };

  const getTopStudentDetails = () => {
    if (!users || !topStudentUids) return [];
    // Return in the order they are in topStudentUids
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
        <CardDescription>Add, remove, and reorder students for the "Top 10 Students of the Week" list.</CardDescription>
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
                        {(usersLoading || !availableUsers) && <p className="p-2 text-sm text-muted-foreground">Loading users...</p>}
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
          <h3 className="font-semibold mb-2">Current Top Students ({topStudentUids.length}/10)</h3>
          {topStudentsLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : getTopStudentDetails().length === 0 ? (
            <p className="text-muted-foreground text-center p-4 border rounded-md">No top students selected yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getTopStudentDetails().map((student: any, index: number) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-bold text-lg">{index + 1}</TableCell>
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
                    <TableCell className="space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => moveStudent(index, 'up')} disabled={index === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                       <Button variant="ghost" size="icon" onClick={() => moveStudent(index, 'down')} disabled={index === topStudentUids.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleRemoveTopStudent(student.id)}>
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

    