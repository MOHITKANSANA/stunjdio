import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Book, ClipboardCheck, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Welcome back, Student!</h1>
        <p className="text-muted-foreground mt-2">Let's continue your learning journey and achieve your goals.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-col md:flex-row">
            <div className="p-6 flex-1">
              <h2 className="text-2xl font-semibold font-headline mb-2">Personalized Learning Path</h2>
              <p className="text-muted-foreground mb-4">
                Take a quick assessment to get a learning path tailored just for you. Discover your strengths and areas for improvement.
              </p>
              <Button asChild>
                <Link href="/dashboard/assessment">
                  Start Assessment <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
             <div className="relative h-48 md:h-auto md:w-1/3">
                <Image
                    src="https://picsum.photos/400/300"
                    alt="Abstract learning path"
                    fill
                    className="object-cover rounded-b-lg md:rounded-r-lg md:rounded-bl-none"
                    data-ai-hint="learning path"
                />
            </div>
          </div>
        </Card>
        
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="bg-accent text-accent-foreground rounded-full p-3 w-fit mb-3">
              <Book className="h-6 w-6" />
            </div>
            <CardTitle>Browse Courses</CardTitle>
            <CardDescription>Explore our comprehensive catalog of courses.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/dashboard/courses">View All Courses</Link>
            </Button>
          </CardContent>
        </Card>
        
         <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="bg-accent text-accent-foreground rounded-full p-3 w-fit mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <CardTitle>Practice Tests</CardTitle>
            <CardDescription>Test your knowledge and prepare for exams.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/dashboard/tests">Take a Test</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="bg-accent text-accent-foreground rounded-full p-3 w-fit mb-3">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>Track your learning and test performance.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/dashboard/profile">View Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
