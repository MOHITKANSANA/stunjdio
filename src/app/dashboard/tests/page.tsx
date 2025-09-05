import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { tests } from "@/lib/data";
import { Clock, HelpCircle } from "lucide-react";

export default function TestsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Practice Tests</h1>
        <p className="text-muted-foreground mt-2">Assess your knowledge and prepare for your exams with our practice tests.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tests.map((test) => (
          <Card key={test.title} className="flex flex-col">
            <CardHeader>
              <CardTitle>{test.title}</CardTitle>
              <CardDescription>{test.subject}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>{test.questions} Questions</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-2 h-4 w-4" />
                <span>{test.duration}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Start Test</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
