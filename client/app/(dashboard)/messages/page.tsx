"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loading } from "@/components/ui/loading";
import { Send, Search } from "lucide-react";

interface User {
  _id: string;
  name: string;
  avatar?: string;
  lastSeen?: string;
  online?: boolean;
}

interface Message {
  _id: string;
  sender: string;
  recipient: string;
  content: string;
  createdAt: string;
  read: boolean;
}

interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: {
    content: string;
    createdAt: string;
    sender: string;
  };
  unreadCount: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("http://localhost:5000/api/messages/conversations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch conversations");
        }

        const data = await response.json();
        setConversations(data.data || []);
        
        // Set first conversation as active if available
        if (data.data && data.data.length > 0 && !activeConversation) {
          setActiveConversation(data.data[0]._id);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        toast({
          title: "Error",
          description: "Failed to load conversations. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [toast, activeConversation]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation) return;
      
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`http://localhost:5000/api/messages/conversations/${activeConversation}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }

        const data = await response.json();
        setMessages(data.data || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again later.",
          variant: "destructive",
        });
      }
    };

    if (activeConversation) {
      fetchMessages();
    }
  }, [activeConversation, toast]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !user) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: activeConversation,
          content: newMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      
      // Add the new message to the messages list
      setMessages([...messages, data.data]);
      
      // Clear the input
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (!user) return null;
    return conversation.participants.find(p => p._id !== user._id);
  };

  const filteredConversations = conversations.filter(conversation => {
    const otherParticipant = getOtherParticipant(conversation);
    if (!otherParticipant) return false;
    
    return otherParticipant.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return <Loading message="Loading messages..." />;
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex h-full">
        {/* Conversations sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4 border-r border-border h-full flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-bold mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search conversations..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "No conversations match your search" : "No conversations yet"}
                </p>
                {!searchTerm && (
                  <Button>
                    Start a New Conversation
                  </Button>
                )}
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                if (!otherParticipant) return null;
                
                return (
                  <div
                    key={conversation._id}
                    className={`flex items-center p-4 cursor-pointer hover:bg-muted/50 ${activeConversation === conversation._id ? "bg-muted" : ""}`}
                    onClick={() => setActiveConversation(conversation._id)}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      {otherParticipant.avatar ? (
                        <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} />
                      ) : null}
                      <AvatarFallback>{getInitials(otherParticipant.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium truncate">{otherParticipant.name}</h3>
                        {conversation.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage ? conversation.lastMessage.content : "No messages yet"}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center h-5 w-5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Messages area */}
        <div className="hidden md:flex flex-col flex-1 h-full">
          {activeConversation && conversations.length > 0 ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-border flex items-center">
                {(() => {
                  const conversation = conversations.find(c => c._id === activeConversation);
                  if (!conversation) return null;
                  
                  const otherParticipant = getOtherParticipant(conversation);
                  if (!otherParticipant) return null;
                  
                  return (
                    <>
                      <Avatar className="h-10 w-10 mr-3">
                        {otherParticipant.avatar ? (
                          <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} />
                        ) : null}
                        <AvatarFallback>{getInitials(otherParticipant.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{otherParticipant.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {otherParticipant.online ? "Online" : otherParticipant.lastSeen ? `Last seen ${formatDate(otherParticipant.lastSeen)}` : "Offline"}
                        </p>
                      </div>
                    </>
                  );
                })()} 
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-muted-foreground">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isCurrentUser = user && message.sender === user._id;
                    const showDate = index === 0 || formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);
                    
                    return (
                      <div key={message._id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="text-xs bg-muted px-2 py-1 rounded-md">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] ${isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"} rounded-lg p-3`}>
                            <p>{message.content}</p>
                            <p className="text-xs opacity-70 text-right mt-1">
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center">
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 mr-2"
                  />
                  <Button 
                    size="icon" 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <p className="text-muted-foreground mb-4">
                Select a conversation or start a new one
              </p>
              <Button>
                Start a New Conversation
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}