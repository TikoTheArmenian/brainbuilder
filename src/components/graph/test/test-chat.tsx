import { useState, useRef, useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function TestChat({ isOpen }: { isOpen: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [jwt, setJwt] = useState<string | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchJwt = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setJwt(session?.access_token || null);
    };

    fetchJwt();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, streamingContent]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !jwt) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    try {
      const response = await fetch("/api/ai/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          prompt: input,
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      let accumulatedContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        accumulatedContent += text;
        setStreamingContent(accumulatedContent);
      }

      // Add the complete message to the chat history
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: accumulatedContent },
      ]);
      setStreamingContent("");
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
      setStreamingContent("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="fixed right-4 top-4 h-[calc(100vh-2rem)] w-96 p-4 shadow-lg bg-card text-card-foreground">
      <h2 className="text-lg font-semibold mb-4">Test Chat</h2>
      <div className="h-full flex flex-col">
        <ScrollArea ref={scrollAreaRef} className="flex-1">
          <div className="space-y-4 pr-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted text-muted-foreground"
                } max-w-[80%] ${
                  message.role === "user" ? "ml-auto" : "mr-auto"
                }`}
              >
                {message.content}
              </div>
            ))}
            {streamingContent && (
              <div className="bg-muted text-muted-foreground p-3 rounded-lg max-w-[80%] mr-auto">
                {streamingContent}
              </div>
            )}
            {isLoading && !streamingContent && (
              <div className="bg-muted text-muted-foreground p-3 rounded-lg max-w-[80%] mr-auto">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-md bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading || !jwt}
          />
          <Button type="submit" disabled={isLoading || !jwt}>
            Send
          </Button>
        </form>
      </div>
    </Card>
  );
}
