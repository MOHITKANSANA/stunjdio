
'use client';

import { useState, useEffect } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc, updateDoc, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function ManageTopStudents({ users, loading, topStudentUids, onSelectionChange }: { users: any[] | undefined, loading: boolean, topStudentUids: string[], onSelectionChange: (uid: string) => void }) {
    if (loading) return <Skeleton className="h-64 w-full" />
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Top 10 Students</CardTitle>
                <CardDescription>Select up to 10 students to feature on the dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Select</TableHead>
                            <TableHead>User</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.map((userDoc) => {
                            const user = userDoc.data();
                            const uid = userDoc.id;
                            const isChecked = topStudentUids.includes(uid);
                            return (
                                <TableRow key={uid}>
                                    <TableCell>
                                        <Checkbox 
                                            checked={isChecked}
                                            onCheckedChange={() => onSelectionChange(uid)}
                                            disabled={!isChecked && topStudentUids.length >= 10}
                                        />
                                    </TableCell>
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
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


export function ManageUsers() {
  const [users, usersLoading] = useCollection(query(collection(firestore, 'users'), orderBy('createdAt', 'desc')));
  const [searchTerm, setSearchTerm] = useState('');
  const [topStudentUids, setTopStudentUids] = useState<string[]>([]);
  const [isSavingTop, setIsSavingTop] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
      const topStudentsRef = doc(firestore, 'settings', 'topStudents');
      const unsubscribe = onSnapshot(topStudentsRef, (doc) => {
          if (doc.exists()) {
              setTopStudentUids(doc.data().uids || []);
          }
      });
      return () => unsubscribe();
  }, []);

  const handleTopStudentSelection = (uid: string) => {
      setTopStudentUids(prev => {
          if (prev.includes(uid)) {
              return prev.filter(id => id !== uid);
          }
          if (prev.length < 10) {
              return [...prev, uid];
          }
          toast({ variant: 'destructive', description: "You can only select up to 10 top students." });
          return prev;
      });
  };

  const saveTopStudents = async () => {
      setIsSavingTop(true);
      try {
          const topStudentsRef = doc(firestore, 'settings', 'topStudents');
          await setDoc(topStudentsRef, { uids: topStudentUids });
          toast({ title: "Success!", description: "Top students list has been updated." });
      } catch (error) {
          toast({ variant: 'destructive', title: "Error", description: "Could not save top students." });
      } finally {
          setIsSavingTop(false);
      }
  };

  const filteredUsers = users?.docs.filter(doc => {
      const data = doc.data();
      const name = data.displayName?.toLowerCase() || '';
      const email = data.email?.toLowerCase() || '';
      return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8">
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
        
        <ManageTopStudents 
            users={users?.docs}
            loading={usersLoading}
            topStudentUids={topStudentUids}
            onSelectionChange={handleTopStudentSelection}
        />
        <Button onClick={saveTopStudents} disabled={isSavingTop}>
            {isSavingTop && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Save Top Students
        </Button>
    </div>
  );
}
