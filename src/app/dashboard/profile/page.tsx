
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { userCourses, testHistory, certificates } from "@/lib/data";
import { Award, Pencil } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "S";
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return names[0].charAt(0) + names[names.length - 1].charAt(0);
    }
    return name.charAt(0);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={user?.photoURL || undefined} data-ai-hint="student" />
          <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <h1 className="text-3xl md:text-4xl font-bold font-headline">{user?.displayName || "Student Name"}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/complete-profile">
            <Pencil className="mr-2 h-4 w-4" />
            {t('edit_profile')}
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="courses">{t('my_courses')}</TabsTrigger>
          <TabsTrigger value="tests">{t('test_history')}</TabsTrigger>
          <TabsTrigger value="certificates">{t('certificates')}</TabsTrigger>
        </TabsList>
        <TabsContent value="courses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('my_courses')}</CardTitle>
              <CardDescription>{t('your_enrolled_courses')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {userCourses.map((course) => (
                <div key={course.name}>
                  <div className="flex justify-between mb-2">
                    <h3 className="font-semibold">{t(course.name.toLowerCase().replace(/ /g, '_'))}</h3>
                    <p className="text-sm text-muted-foreground">{course.progress}% {t('complete')}</p>
                  </div>
                  <Progress value={course.progress} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('test_history')}</CardTitle>
              <CardDescription>{t('review_past_scores')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {testHistory.map((test) => (
                  <li key={test.name} className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="font-semibold">{t(test.name.toLowerCase().replace(/ /g, '_'))}</h3>
                      <p className="text-sm text-muted-foreground">{t('completed_on')} {test.date}</p>
                    </div>
                    <Badge variant={parseInt(test.score) > 80 ? "default" : "secondary"}>{t('score')}: {test.score}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="certificates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('my_certificates')}</CardTitle>
              <CardDescription>{t('your_earned_certificates')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {certificates.map((cert) => (
                <div key={cert.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Award className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{t('certificate_of_completion')}: {t(cert.course.toLowerCase().replace(/ /g, '_'))}</h3>
                      <p className="text-sm text-muted-foreground">{t('issued_on')} {cert.date}</p>
                    </div>
                  </div>
                  <Button variant="outline">{t('download')}</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
