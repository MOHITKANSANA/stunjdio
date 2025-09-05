import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { dashboardGridItems } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Hello, Student!</h1>
      </div>
      
      <Card className="overflow-hidden">
        <div className="relative h-48 w-full">
            <Image 
                src="https://picsum.photos/800/200"
                alt="Promotional Banner"
                fill
                className="object-cover"
                data-ai-hint="promotional banner"
            />
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5">
        {dashboardGridItems.map((item) => (
          <Link href={item.href} key={item.label}>
            <Card className="h-full hover:bg-muted/50 transition-colors">
              <CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                <div className="flex items-center justify-center p-3 bg-red-100 dark:bg-red-900/50 rounded-full text-primary">
                    <item.icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
