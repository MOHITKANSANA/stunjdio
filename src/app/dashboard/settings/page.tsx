import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const languages = [
  "English", "Hindi", "Marathi", "Bengali", "Gujarati", "Kannada", "Malayalam",
  "Odia", "Punjabi", "Tamil", "Telugu", "Urdu"
];

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold font-headline mb-8">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Manage your account settings and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">Choose between light and dark mode.</p>
            </div>
            <ThemeToggle />
          </div>
          
          <div className="p-4 border rounded-lg">
            <Label htmlFor="language">Default Language</Label>
            <p className="text-sm text-muted-foreground mb-2">Select your preferred language for the interface.</p>
            <Select defaultValue="English">
              <SelectTrigger id="language" className="w-full">
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
      </Card>
    </div>
  );
}
