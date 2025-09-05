"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { generateAiTutorResponseAction } from "@/app/actions/ai-tutor";
import type { GenerateAiTutorResponseOutput } from "@/ai/flows/generate-ai-tutor-response";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Mic, Paperclip, Send, Sparkles, Volume2, X } from "lucide-react";
import Image from "next/image";

const tutorSchema = z.object({
  question: z.string().min(1, { message: "Please ask a question." }),
  language: z.string().default("English"),
  imageFile: z.instanceof(File).optional(),
});

type TutorFormValues = z.infer<typeof tutorSchema>;

export default function AiTutorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<GenerateAiTutorResponseOutput | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<TutorFormValues>({
    resolver: zodResolver(tutorSchema),
    defaultValues: {
      question: "",
      language: "English",
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      form.setValue("imageFile", file);
      setPreviewImage(URL.createObjectURL(file));
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

  const onSubmit = async (data: TutorFormValues) => {
    setIsLoading(true);
    setResponse(null);
    setAudioUrl(null);

    let imageDataUri: string | undefined = undefined;
    if (data.imageFile) {
        imageDataUri = await fileToDataUri(data.imageFile);
    }
    
    try {
      const result = await generateAiTutorResponseAction({
        question: data.question,
        language: data.language,
        imageDataUri: imageDataUri
      });
      setResponse(result);
    } catch (error) {
      console.error("Error generating AI response:", error);
      setResponse({
          answer: "Sorry, I couldn't generate a response. Please try again.",
          followUpQuestions: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = async () => {
    if (!response?.answer) return;
    setIsAudioLoading(true);
    setAudioUrl(null);
    try {
        const { getAudioAction } = await import("@/app/actions/ai-tutor");
        const audioResult = await getAudioAction(response.answer);
        setAudioUrl(audioResult.media);
        const audio = new Audio(audioResult.media);
        audio.play();
    } catch (error) {
        console.error("Error generating audio:", error);
    } finally {
        setIsAudioLoading(false);
    }
  }
  
  const askFollowUp = (question: string) => {
    form.setValue("question", question);
    form.handleSubmit(onSubmit)();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline">AI Tutor</h1>
        <p className="text-muted-foreground mt-2">
          Your personal AI-powered study assistant. Ask anything!
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ask a Question</CardTitle>
          <CardDescription>
            Type your question below, select a language, and optionally upload an image.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-3">
              <Label htmlFor="question">Your Question</Label>
              <Textarea
                id="question"
                placeholder="e.g., Explain the theory of relativity..."
                className="min-h-32"
                {...form.register("question")}
              />
              {form.formState.errors.question && (
                <p className="text-xs text-destructive">{form.formState.errors.question.message}</p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
                 <div className="w-full sm:w-1/2 grid gap-3">
                    <Label htmlFor="language">Response Language</Label>
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
                 <div className="w-full sm:w-1/2 grid gap-3">
                    <Label>Attach Image (Optional)</Label>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
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
              <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
                <Image src={previewImage} alt="Image preview" fill style={{ objectFit: 'cover' }} />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Get Answer</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardHeader>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Sparkles className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>AI Response</CardTitle>
                        <CardDescription>Here is the answer to your question.</CardDescription>
                    </div>
                </div>
                <Button onClick={handlePlayAudio} size="icon" variant="outline" disabled={isAudioLoading}>
                    {isAudioLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
                    <span className="sr-only">Read aloud</span>
                </Button>
             </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose dark:prose-invert max-w-none text-foreground">
              {response.answer}
            </div>

            {response.followUpQuestions && response.followUpQuestions.length > 0 && (
                <div>
                    <h3 className="font-semibold mb-3">Follow-up Questions:</h3>
                    <div className="flex flex-col gap-2">
                        {response.followUpQuestions.map((q, index) => (
                            <Button key={index} variant="outline" className="justify-start text-left h-auto" onClick={() => askFollowUp(q)}>
                                {q}
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
