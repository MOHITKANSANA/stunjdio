
"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/hooks/use-language";

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { value: "en", label: "English" },
    { value: "hi", label: "Hindi" },
    { value: "kn", label: "Kannada" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold font-headline mb-8">{t('settings')}</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('preferences')}</CardTitle>
          <CardDescription>{t('manage_account_settings')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label>{t('theme')}</Label>
              <p className="text-sm text-muted-foreground">{t('choose_theme')}</p>
            </div>
            <ThemeToggle />
          </div>
          
          <div className="p-4 border rounded-lg">
            <Label htmlFor="language">{t('default_language')}</Label>
            <p className="text-sm text-muted-foreground mb-2">{t('select_language')}</p>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language" className="w-full">
                <SelectValue placeholder={t('select_language_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
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
