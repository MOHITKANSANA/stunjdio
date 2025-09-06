
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";


export default function AdminPage() {

  const [value, loading, error] = useCollection(
    query(collection(firestore, 'users'), orderBy('lastLogin', 'desc'))
  );

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "S";
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return names[0].charAt(0) + names[names.length - 1].charAt(0);
    }
    return name.charAt(0);
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <h1 className="text-3xl font-semibold font-headline">Administration</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Course</CardTitle>
            <CardDescription>
              Fill out the details below to add a new course to the catalog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  type="text"
                  className="w-full"
                  placeholder="e.g. Algebra Fundamentals"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  type="text"
                  className="w-full"
                  placeholder="e.g. Maths"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="A short description of the course content."
                  className="min-h-32"
                />
              </div>
              <Button type="submit">Create Course</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              View and manage users who have logged into the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {error && <p className="text-destructive">Error: {error.message}</p>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                    <>
                        <TableRow>
                            <TableCell><Skeleton className="h-9 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-9 w-full" /></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><Skeleton className="h-9 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-9 w-full" /></TableCell>
                        </TableRow>
                    </>
                )}
                {value && value.docs.map((doc) => {
                  const user = doc.data();
                  return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.photoURL || undefined} alt={user.displayName} data-ai-hint="student" />
                              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">
                              <p>{user.displayName}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                           <Badge variant="outline">{user.lastLogin ? new Date(user.lastLogin.seconds * 1000).toLocaleDateString() : 'N/A'}</Badge>
                        </TableCell>
                      </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
