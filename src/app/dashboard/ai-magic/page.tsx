
"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { performAiMagicAction } from "@/app/actions/ai-magic";
import type { AiMagicOutput } from "@/ai/flows/ai-magic";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Paperclip, Send, Wand2, X, AlertTriangle, Image as ImageIcon, MessageSquare, BrainCircuit } from "lucide-react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const aiMagicSchema = z.object({
  prompt: z.string(),
  imageFile: z.instanceof(File).optional(),
}).refine(data => !!data.prompt || !!data.imageFile, {
  message: "Please enter a prompt or upload an image.",
  path: ["prompt"], 
});

type AiMagicFormValues = z.infer<typeof aiMagicSchema>;

export default function AiMagicPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AiMagicOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const form = useForm<AiMagicFormValues>({
    resolver: zodResolver(aiMagicSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      form.setValue("imageFile", file);
      setPreviewImage(URL.createObjectURL(file));
      form.clearErrors("prompt"); 
    }
  };

  const removeImage = () => {
    form.setValue("imageFile", undefined);
    setPreviewImage(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }
  
  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  }

  const onSubmit = async (data: AiMagicFormValues) => {
    setIsLoading(true);
    setResponse(null);
    setError(null);

    let imageDataUri: string | undefined = undefined;
    if (data.imageFile) {
        imageDataUri = await fileToDataUri(data.imageFile);
    }
    
    try {
      const result = await performAiMagicAction({
        prompt: data.prompt,
        imageDataUri: imageDataUri
      });
      setResponse(result);
    } catch (e: any) {
      console.error("Error performing AI Magic:", e);
      setError(e.message || "Sorry, I couldn't generate a response. Please try again.");
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: e.message || "Please try again later."
      })
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400 flex items-center justify-center gap-3">
          <Wand2 className="h-10 w-10" />
          AI Magic
        </h1>
        <p className="text-muted-foreground mt-2">
          Your all-in-one AI assistant for questions and image generation.
        </p>
      </div>
      
      <Card className="shadow-lg border-border/60">
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="relative">
                <Textarea
                    placeholder="Ask a question, solve a math problem from an image, or describe an image to create..."
                    className="min-h-32 resize-none border-2 border-input focus:border-primary transition-colors pr-24"
                    {...form.register("prompt")}
                />
                <div className="absolute bottom-3 right-3 flex gap-2">
                    <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="h-5 w-5" />
                        <span className="sr-only">Attach Image</span>
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/png, image/jpeg"
                    />
                    <Button type="submit" size="icon" className="rounded-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        <span className="sr-only">Get Answer</span>
                    </Button>
                </div>
            </div>
            {form.formState.errors.prompt && (
                <p className="text-xs text-destructive -mt-2 ml-1">{form.formState.errors.prompt.message}</p>
            )}

            {previewImage && (
              <div className="relative w-32 h-32 border rounded-lg overflow-hidden shadow-sm">
                <Image src={previewImage} alt="Image preview" fill style={{ objectFit: 'cover' }} />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 rounded-full"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
      
       {isLoading && (
         <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
            <div className="animate-spin-slow">
                <Wand2 className="h-12 w-12 text-primary" />
            </div>
            <p className="text-muted-foreground">AI is performing its magic...</p>
         </div>
       )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {response && (
        <Card className="shadow-lg border-border/60">
            <Tabs defaultValue="answer">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="answer"><MessageSquare className="mr-2"/> AI Answer</TabsTrigger>
                    <TabsTrigger value="image" disabled={!response.generatedImageDataUri}><ImageIcon className="mr-2"/> Generated Image</TabsTrigger>
                </TabsList>
                <TabsContent value="answer" className="p-6">
                    <div className="prose dark:prose-invert max-w-none text-foreground whitespace-pre-wrap break-words leading-relaxed">
                        {response.answer}
                    </div>
                </TabsContent>
                <TabsContent value="image" className="p-6">
                    {response.generatedImageDataUri ? (
                        <div className="flex flex-col items-center gap-4">
                            <Image
                                src={response.generatedImageDataUri}
                                alt="Generated by AI"
                                width={512}
                                height={512}
                                className="rounded-lg shadow-md border"
                            />
                             <Button asChild>
                                <a href={response.generatedImageDataUri} download="ai-generated-image.png">
                                    Download Image
                                </a>
                            </Button>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center">No image was generated for this prompt.</p>
                    )}
                </TabsContent>
            </Tabs>
        </Card>
      )}
    </div>
  );
}
