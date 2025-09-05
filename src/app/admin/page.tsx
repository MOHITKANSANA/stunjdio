
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

// Mock user data for demonstration purposes
const users = [
  {
    name: "Suresh Kumar",
    email: "suresh@example.com",
    lastLogin: "2024-09-05",
    avatar: "https://picsum.photos/100/100?random=1",
    initials: "SK",
  },
  {
    name: "Priya Sharma",
    email: "priya@example.com",
    lastLogin: "2024-09-05",
    avatar: "https://picsum.photos/100/100?random=2",
    initials: "PS",
  },
  {
    name: "Amit Patel",
    email: "amit@example.com",
    lastLogin: "2024-09-04",
    avatar: "https://picsum.photos/100/100?random=3",
    initials: "AP",
  },
];

export default function AdminPage() {
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.email}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="student" />
                          <AvatarFallback>{user.initials}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">
                          <p>{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline">{user.lastLogin}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
