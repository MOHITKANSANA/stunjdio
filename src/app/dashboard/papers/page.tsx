import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper } from "lucide-react";

const papers = [
    { title: "Previous Year Paper - 2023", subject: "General" },
    { title: "Previous Year Paper - 2022", subject: "General" },
    { title: "Previous Year Paper - 2021", subject: "General" },
    { title: "Previous Year Paper - 2020", subject: "General" },
];

export default function PapersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Previous Year Papers</h1>
        <p className="text-muted-foreground mt-2">Practice with papers from previous years to understand the exam pattern.</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {papers.map((paper) => (
          <Card key={paper.title}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{paper.title}</CardTitle>
                    <Newspaper className="h-6 w-6 text-primary" />
                </div>
              <CardDescription>{paper.subject}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Click to view and download the paper.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
