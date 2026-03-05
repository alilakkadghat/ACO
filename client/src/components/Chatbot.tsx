import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_PROMPT = `You are an AI assistant for an Ant Colony Optimization (ACO) virus simulation dashboard.
The simulation models how decentralized agents (ants) combat a malware infection spreading through a computer network.
Ants use pheromones to communicate threat intelligence and prioritize paths with higher threat confidence.
Your purpose is to answer user questions about the simulation, the ACO algorithm, and the metrics.
Keep answers concise, helpful, and focused on the simulation context.`;

export function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: "user" | "model"; text: string }[]>([
        { role: "model", text: "Hello! I can answer questions about the ACO virus simulation. How can I help?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
        setIsLoading(true);

        try {
            const history = messages.slice(1).map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: SYSTEM_PROMPT + "\n\nUser Question: " + userMessage }
                        ]
                    }
                ],
            });

            setMessages((prev) => [...prev, { role: "model", text: response.text || "" }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [...prev, { role: "model", text: "I'm sorry, I encountered an error while processing your request. Please check if the API key is valid." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                size="icon"
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50 transition-transform hover:scale-105"
            >
                <MessageCircle className="h-6 w-6 text-primary-foreground" />
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-6 right-6 w-80 sm:w-[400px] h-[500px] max-h-[80vh] flex flex-col shadow-2xl z-50 border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b border-border">
                <CardTitle className="text-sm font-bold font-mono text-primary flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    SIMULATION ASSISTANT
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-y-auto" ref={scrollRef}>
                <div className="p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex w-max max-w-[85%] flex-col gap-2 rounded-lg px-3 py-2 text-sm ${msg.role === "user"
                                ? "ml-auto bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                                }`}
                        >
                            {msg.text}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex w-max max-w-[85%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-muted text-foreground">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-4 border-t border-border bg-background/95">
                <form
                    className="flex w-full items-center space-x-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                >
                    <Input
                        id="message"
                        placeholder="Ask about the simulation..."
                        className="flex-1 bg-background"
                        autoComplete="off"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="bg-primary text-primary-foreground shrink-0 cursor-pointer">
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
