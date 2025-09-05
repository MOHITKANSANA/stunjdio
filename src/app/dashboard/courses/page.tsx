import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { courses } from "@/lib/data";

export default function CoursesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Our Courses</h1>
        <p className="text-muted-foreground mt-2">Explore our comprehensive catalog of courses to enhance your skills.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.map((course) => (
          <Card key={course.title} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.category}</CardDescription>
                </div>
                 <div className="p-3 bg-accent text-accent-foreground rounded-full">
                    <course.icon className="h-6 w-6" />
                 </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">{course.description}</p>
            </CardContent>
            <div className="p-6 pt-0">
               <Button className="w-full">Enroll Now</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
