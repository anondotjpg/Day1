// app/components/Chat.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, type Message } from "../lib/supabase";

interface ChatProps {
  dayId: number;
  username: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

export default function Chat({ dayId, username }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{
    file: File;
    url: string;
    type: "image" | "video";
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Please select an image or video file");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert("File size must be under 50MB");
      return;
    }

    const type = file.type.startsWith("video/") ? "video" : "image";
    const url = URL.createObjectURL(file);

    setPreviewMedia({ file, url, type });

    // Clear the input so same file can be selected again
    e.target.value = "";
  };

  // Remove preview
  const clearPreview = () => {
    if (previewMedia) {
      URL.revokeObjectURL(previewMedia.url);
      setPreviewMedia(null);
    }
  };

  // Upload file to Supabase Storage
  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${dayId}/${username}-${Date.now()}.${fileExt}`;

    setIsUploading(true);

    const { data, error } = await supabase.storage
      .from("chat-media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    setIsUploading(false);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("chat-media")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const content = input.trim();
    if (!content && !previewMedia) return;
    if (isSending || isUploading) return;

    setIsSending(true);
    setInput("");

    let mediaUrl: string | null = null;
    let mediaType: "image" | "video" | null = null;

    // Upload media if present
    if (previewMedia) {
      mediaUrl = await uploadFile(previewMedia.file);
      mediaType = previewMedia.type;
      clearPreview();

      if (!mediaUrl) {
        alert("Failed to upload media");
        setIsSending(false);
        return;
      }
    }

    const { error } = await supabase.from("messages").insert({
      day_id: dayId,
      username,
      content: content || null,
      media_url: mediaUrl,
      media_type: mediaType,
    });

    if (error) {
      console.error("Error sending message:", error);
      setInput(content);
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
                <div
                  className={`flex items-center gap-2 mb-1 px-1 ${isOwn ? "flex-row-reverse" : ""}`}
                >
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
                    max-w-[85%] rounded-2xl overflow-hidden
                    ${isOwn
                      ? "bg-[#0A84FF] text-white rounded-br-md"
                      : "bg-[#1c1c1e] text-white/90 rounded-bl-md"
                    }
                    ${message.media_url && !message.content ? "" : "px-4 py-2.5"}
                  `}
                >
                  {/* Media */}
                  {message.media_url && (
                    <div className={message.content ? "mb-2" : ""}>
                      {message.media_type === "video" ? (
                        <video
                          src={message.media_url}
                          controls
                          playsInline
                          className="max-w-full max-h-[300px] rounded-lg"
                        />
                      ) : (
                        <img
                          src={message.media_url}
                          alt=""
                          className="max-w-full max-h-[300px] rounded-lg object-contain"
                          loading="lazy"
                        />
                      )}
                    </div>
                  )}

                  {/* Text */}
                  {message.content && (
                    <p className={`text-[15px] leading-relaxed ${message.media_url ? "px-4 pb-2.5" : ""}`}>
                      {message.content}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Media Preview */}
      {previewMedia && (
        <div className="relative mb-3 inline-block">
          <div className="relative rounded-xl overflow-hidden bg-[#1c1c1e] inline-block">
            {previewMedia.type === "video" ? (
              <video
                src={previewMedia.url}
                className="max-h-[200px] max-w-[300px] object-contain"
              />
            ) : (
              <img
                src={previewMedia.url}
                alt="Preview"
                className="max-h-[200px] max-w-[300px] object-contain"
              />
            )}
            {/* Remove button */}
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message"
          disabled={isSending || isUploading}
          className="
            w-full pl-12 pr-12 py-3
            bg-[#1c1c1e] text-white text-[15px]
            placeholder:text-white/30
            rounded-full border border-white/10
            outline-none
            focus:border-white/20
            transition-colors
            disabled:opacity-50
          "
        />

        {/* Media button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending || isUploading}
          className="
            absolute left-2 top-1/2 -translate-y-1/2
            w-8 h-8 flex items-center justify-center
            rounded-full text-white/40 hover:text-white/60
            disabled:opacity-50
            transition-colors
          "
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={(!input.trim() && !previewMedia) || isSending || isUploading}
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