
"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { generateAiTutorResponseAction, getAudioAction } from "@/app/actions/ai-tutor";
import type { GenerateAiTutorResponseOutput } from "@/ai/flows/generate-ai-tutor-response";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Paperclip, Send, Sparkles, Volume2, X, AlertTriangle } from "lucide-react";
import Image from "next/image";

const tutorSchema = z.object({
  question: z.string(),
  language: z.string().default("English"),
  imageFile: z.instanceof(File).optional(),
}).refine(data => !!data.question || !!data.imageFile, {
  message: "Please ask a question or upload an image.",
  path: ["question"], 
});

type TutorFormValues = z.infer<typeof tutorSchema>;

export default function AiTutorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<GenerateAiTutorResponseOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const form = useForm<TutorFormValues>({
    resolver: zodResolver(tutorSchema),
    defaultValues: {
      question: "",
      language: "English",
    },
  });
  
  // Effect to play audio when URL is set
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [audioUrl]);


  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      form.setValue("imageFile", file);
      setPreviewImage(URL.createObjectURL(file));
      form.clearErrors("question"); 
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

  const handlePlayAudio = async (text: string) => {
    if (!text) return;
    setIsAudioLoading(true);
    setAudioUrl(null);
    try {
        const audioResult = await getAudioAction(text);
        setAudioUrl(audioResult.media);
    } catch (error) {
        console.error("Error generating audio:", error);
        // Optionally set an error state for audio
    } finally {
        setIsAudioLoading(false);
    }
  }

  const onSubmit = async (data: TutorFormValues) => {
    setIsLoading(true);
    setResponse(null);
    setError(null);
    setAudioUrl(null);

    let imageDataUri: string | undefined = undefined;
    if (data.imageFile) {
        imageDataUri = await fileToDataUri(data.imageFile);
    }
    
    try {
      const result = await generateAiTutorResponseAction({
        question: data.question || "Describe the attached image.",
        language: data.language,
        imageDataUri: imageDataUri
      });
      setResponse(result);
      if(result.answer){
        handlePlayAudio(result.answer)
      }
    } catch (e: any) {
      console.error("Error generating AI response:", e);
      setError(e.message || "Sorry, I couldn't generate a response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const askFollowUp = (question: string) => {
    form.setValue("question", question);
    form.setValue("imageFile", undefined);
    setPreviewImage(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    form.handleSubmit(onSubmit)();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          AI Tutor
        </h1>
        <p className="text-muted-foreground mt-2">
          Your personal AI-powered study assistant. Ask anything!
        </p>
      </div>
      <audio ref={audioRef} className="hidden" />
      <Card className="shadow-lg border-border/60">
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative">
              <Label htmlFor="question" className="sr-only">Your Question</Label>
              <Textarea
                id="question"
                placeholder="e.g., Explain the theory of relativity, or upload an image and ask about it."
                className="min-h-36 resize-none border-2 border-input focus:border-primary transition-colors pr-24"
                {...form.register("question")}
              />
              <Button type="submit" size="icon" className="absolute bottom-3 right-3 rounded-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                 <span className="sr-only">Get Answer</span>
              </Button>
            </div>
             {form.formState.errors.question && (
                <p className="text-xs text-destructive -mt-2 ml-1">{form.formState.errors.question.message}</p>
              )}
            
            <div className="flex flex-col sm:flex-row gap-4">
                 <div className="w-full sm:w-1/2 grid gap-2">
                    <Label htmlFor="language" className="text-sm font-medium">Response Language</Label>
                    <Select onValueChange={(value) => form.setValue("language", value)} defaultValue={form.getValues("language")}>
                        <SelectTrigger id="language">
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="Kannada">Kannada</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="w-full sm:w-1/2 grid gap-2">
                    <Label htmlFor="image-upload" className="text-sm font-medium">Attach Image (Optional)</Label>
                    <Button id="image-upload" type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="mr-2 h-4 w-4" />
                        Upload Image
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif"
                    />
                </div>
            </div>

            {previewImage && (
              <div className="relative w-40 h-40 border rounded-lg overflow-hidden shadow-sm">
                <Image src={previewImage} alt="Image preview" fill style={{ objectFit: 'cover' }} />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full"
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
         <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <CardHeader>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Sparkles className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>AI Response</CardTitle>
                        <CardDescription>Here is the answer to your question.</CardDescription>
                    </div>
                </div>
                <Button onClick={() => handlePlayAudio(response.answer)} size="icon" variant="outline" disabled={isAudioLoading}>
                    {isAudioLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
                    <span className="sr-only">Read aloud</span>
                </Button>
             </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose dark:prose-invert max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
              {response.answer}
            </div>

            {response.followUpQuestions && response.followUpQuestions.length > 0 && (
                <div>
                    <h3 className="font-semibold mb-3">Follow-up Questions:</h3>
                    <div className="flex flex-wrap gap-2">
                        {response.followUpQuestions.map((q, index) => (
                            <Button key={index} variant="outline" size="sm" className="h-auto whitespace-normal text-left" onClick={() => askFollowUp(q)}>
                                <span className="py-1">{q}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
