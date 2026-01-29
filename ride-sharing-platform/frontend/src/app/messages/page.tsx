'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import {
    ArrowLeft,
    Send,
    MessageCircle,
    User
} from 'lucide-react';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'driver';
    timestamp: Date;
}

interface Chat {
    id: string;
    driverName: string;
    lastMessage: string;
    unread: number;
    rideInfo: string;
}

export default function MessagesPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Mock chats
    useEffect(() => {
        if (isAuthenticated) {
            setChats([
                {
                    id: '1',
                    driverName: 'Rajesh Kumar',
                    lastMessage: 'I will be there in 5 minutes',
                    unread: 2,
                    rideInfo: 'MG Road → Koramangala'
                },
                {
                    id: '2',
                    driverName: 'Priya Sharma',
                    lastMessage: 'Confirmed! See you tomorrow at 9 AM',
                    unread: 0,
                    rideInfo: 'Indiranagar → Electronic City'
                },
            ]);
        }
    }, [isAuthenticated]);

    // Mock messages for selected chat
    useEffect(() => {
        if (selectedChat) {
            setMessages([
                { id: '1', text: 'Hi! I am your driver for today.', sender: 'driver', timestamp: new Date(Date.now() - 3600000) },
                { id: '2', text: 'Great! I am at the pickup point.', sender: 'user', timestamp: new Date(Date.now() - 3000000) },
                { id: '3', text: 'I will be there in 5 minutes', sender: 'driver', timestamp: new Date(Date.now() - 60000) },
            ]);
        }
    }, [selectedChat]);

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        const message: Message = {
            id: Date.now().toString(),
            text: newMessage,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, message]);
        setNewMessage('');

        // Simulate driver response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: 'Got it! Thanks for the update.',
                sender: 'driver',
                timestamp: new Date(),
            }]);
        }, 1500);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        {selectedChat ? (
                            <>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedChat(null)}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div>
                                    <h1 className="font-semibold">{selectedChat.driverName}</h1>
                                    <p className="text-sm text-muted-foreground">{selectedChat.rideInfo}</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link href="/dashboard">
                                    <Button variant="ghost" size="icon">
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                </Link>
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="h-6 w-6 text-primary" />
                                    <span className="text-xl font-bold">Messages</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto max-w-2xl">
                {selectedChat ? (
                    /* Chat View */
                    <div className="flex flex-col h-[calc(100vh-80px)]">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${message.sender === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                : 'bg-white dark:bg-gray-800 border rounded-bl-sm'
                                            }`}
                                    >
                                        <p>{message.text}</p>
                                        <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 bg-white dark:bg-gray-800 border-t">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1"
                                />
                                <Button onClick={handleSendMessage}>
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Chat List */
                    <div className="p-4 space-y-3">
                        {chats.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Book a ride to start chatting with your driver!
                                    </p>
                                    <Link href="/ride">
                                        <Button>Request a Ride</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            chats.map((chat) => (
                                <Card
                                    key={chat.id}
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => setSelectedChat(chat)}
                                >
                                    <CardContent className="py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-6 w-6 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-semibold">{chat.driverName}</h3>
                                                    {chat.unread > 0 && (
                                                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                                            {chat.unread}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{chat.rideInfo}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
