import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenCheck } from "lucide-react";

const languages = [
  "English", "Hindi", "Marathi", "Bengali", "Gujarati", "Kannada", "Malayalam",
  "Odia", "Punjabi", "Tamil", "Telugu", "Urdu"
];

export default function LanguageSelectionPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
               <BookOpenCheck className="h-10 w-10" />
            </div>
            <CardTitle className="text-3xl font-headline">Go Swami Coaching Classes</CardTitle>
            <CardDescription>Your personalized path to success</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label htmlFor="language-select" className="text-sm font-medium text-muted-foreground">
                Choose your language
              </label>
              <Select defaultValue="English">
                <SelectTrigger id="language-select" className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full text-lg py-6">
              <Link href="/dashboard">Continue</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
