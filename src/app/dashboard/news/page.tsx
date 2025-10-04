
'use client';

import { Newspaper } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

interface Article {
    title: string;
    description: string;
    url: string;
    urlToImage: string;
    source: {
        name: string;
    }
}

export default function NewsPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchNews() {
            try {
                // IMPORTANT: The API key is hardcoded here. For a production app, this should be an environment variable.
                const apiKey = 'c0d8cdce868642738af39ebe6504fdff';
                const response = await fetch(`https://newsapi.org/v2/top-headlines?country=in&apiKey=${apiKey}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch news');
                }
                const data = await response.json();
                if (data.status === 'error') {
                    throw new Error(data.message || 'Error from News API');
                }
                setArticles(data.articles);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchNews();
    }, []);

    return (
        <div className="space-y-8 p-4 md:p-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-headline flex items-center gap-3">
                    <Newspaper className="h-10 w-10 text-primary" />
                    Latest News
                </h1>
                <p className="text-muted-foreground mt-2">Your daily dose of current affairs and news updates from India.</p>
            </div>

            {loading && (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
                </div>
            )}
            
            {error && (
                <div className="text-center py-12 border-2 border-dashed border-destructive rounded-lg">
                    <Newspaper className="mx-auto h-12 w-12 text-destructive" />
                    <h3 className="mt-4 text-lg font-semibold text-destructive">Failed to Load News</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                </div>
            )}

            {!loading && !error && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {articles.map((article, index) => (
                         <a href={article.url} target="_blank" rel="noopener noreferrer" key={index} className="block">
                            <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                                {article.urlToImage && (
                                    <div className="relative h-48 w-full">
                                        <Image src={article.urlToImage} alt={article.title} fill style={{objectFit: 'cover'}} />
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="text-lg line-clamp-3">{article.title}</CardTitle>
                                    <CardDescription>{article.source.name}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-muted-foreground text-sm line-clamp-4">{article.description}</p>
                                </CardContent>
                            </Card>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
