'use server';

interface Article {
    title: string;
    description: string;
    url: string;
    urlToImage: string;
    source: {
        name: string;
    }
}

interface NewsApiResponse {
    articles: Article[];
    error?: string;
}

export async function getNewsAction(): Promise<NewsApiResponse> {
    try {
        const apiKey = process.env.NEWS_API_KEY || 'c0d8cdce868642738af39ebe6504fdff';
        const response = await fetch(`https://newsapi.org/v2/top-headlines?country=in&apiKey=${apiKey}`, {
             // Add a revalidation period to cache the results and avoid hitting the API on every request
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error("News API response error:", errorData);
            throw new Error(errorData.message || 'Failed to fetch news from the server.');
        }

        const data = await response.json();

        if (data.status === 'error') {
            console.error("News API status error:", data);
            throw new Error(data.message || 'Error from News API');
        }
        
        return { articles: data.articles };
    } catch (err: any) {
        console.error("Error in getNewsAction:", err);
        return { articles: [], error: err.message || "An unknown error occurred while fetching news." };
    }
}
