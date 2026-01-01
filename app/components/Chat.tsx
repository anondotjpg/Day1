// app/components/Chat.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, type Message } from "@/lib/supabase";

interface ChatProps {
  dayId: number;
  username: string;
}

export default function Chat({ dayId, username }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("day_id", dayId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data || []);
      }
      setIsLoading(false);
    };

    fetchMessages();
  }, [dayId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`chat:day:${dayId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `day_id=eq.${dayId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dayId]);

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const content = input.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setInput("");

    const { error } = await supabase.from("messages").insert({
      day_id: dayId,
      username,
      content,
    });

    if (error) {
      console.error("Error sending message:", error);
      setInput(content); // Restore input on error
    }

    setIsSending(false);
    inputRef.current?.focus();
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4 scrollbar-none">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full min-h-[200px]">
            <p className="text-white/30 text-[15px]">No messages yet</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.username === username;
            return (
              <div
                key={message.id}
                className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
              >
                {/* Username & time */}
                <div className={`flex items-center gap-2 mb-1 px-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                  <span className="text-[12px] text-white/40 font-medium">
                    {isOwn ? "You" : `@${message.username}`}
                  </span>
                  <span className="text-[11px] text-white/20">
                    {formatTime(message.created_at)}
                  </span>
                </div>
                
                {/* Bubble */}
                <div
                  className={`
                    max-w-[85%] px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed
                    ${isOwn
                      ? "bg-[#0A84FF] text-white rounded-br-md"
                      : "bg-[#1c1c1e] text-white/90 rounded-bl-md"
                    }
                  `}
                >
                  {message.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="relative mt-4">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message"
          disabled={isSending}
          className="
            w-full px-4 py-3 pr-12
            bg-[#1c1c1e] text-white text-[15px]
            placeholder:text-white/30
            rounded-full border border-white/10
            outline-none
            focus:border-white/20
            transition-colors
            disabled:opacity-50
          "
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="
            absolute right-2 top-1/2 -translate-y-1/2
            w-8 h-8 flex items-center justify-center
            rounded-full bg-[#0A84FF]
            disabled:opacity-30 disabled:bg-white/10
            transition-opacity
          "
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}