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

export default function AdminPage() {
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-2">
      <h1 className="text-3xl font-semibold font-headline">Course Administration</h1>

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
    </div>
  );
}
