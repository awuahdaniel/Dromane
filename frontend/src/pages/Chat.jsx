import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { sendChatMessage, summarizeDocument, explainCode, checkHealth } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Upload from '../components/Upload';

export default function Chat({ mode = 'research' }) {
    const [messages, setMessages] = useState([]);
    const [currentDoc, setCurrentDoc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [backendReady, setBackendReady] = useState(false);
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login', { replace: true });
            return;
        }

        if (isAuthenticated) {
            checkHealth()
                .then(() => setBackendReady(true))
                .catch(() => setBackendReady(false));
        }
    }, [isAuthenticated, isLoading, navigate]);

    // Handle Mode-Specific UI/Logic
    const getPageTitle = () => {
        switch (mode) {
            case 'pdf': return 'PDF Research Assistant';
            case 'code': return 'Code Expert & Analyzer';
            default: return 'General Intelligence';
        }
    };

    const handleSendMessage = async (input) => {
        if (!input.trim()) return;

        if (mode === 'pdf' && !currentDoc) {
            setMessages(prev => [...prev, { role: 'system', content: 'Please upload a PDF document first to use this tool.' }]);
            return;
        }

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);

        try {
            let response;
            if (mode === 'code') {
                response = await explainCode(input);
            } else {
                response = await sendChatMessage(input);
            }

            const botMessage = { role: 'assistant', content: response.answer || response.summary || response.message };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'system',
                content: `**Error**: ${error.message}.`
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSummarize = async () => {
        if (mode !== 'pdf' || !currentDoc || loading) return;

        setMessages(prev => [...prev, { role: 'system', content: '*Summarizing document using AI...*' }]);
        setLoading(true);

        try {
            const { summary } = await summarizeDocument();
            setMessages(prev => [...prev, { role: 'assistant', content: `### Document Summary\n${summary}` }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'system', content: 'Summarization failed.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleExplainCode = async () => {
        if (mode !== 'code') {
            navigate('/dashboard/code');
            return;
        }
        const code = prompt("Paste the code block you want me to explain:");
        if (!code) return;
        handleSendMessage(code);
    };

    const handleSelectDoc = (doc) => {
        setCurrentDoc(doc);
        setMessages(prev => [...prev, {
            role: 'system',
            content: `Context switched to: **${doc.filename}**`
        }]);
    };

    return (
        <div className="flex bg-gray-50 dark:bg-slate-950 overflow-hidden h-screen w-full transition-colors">
            <Sidebar
                currentDoc={currentDoc}
                onSelectDoc={handleSelectDoc}
            />

            <main className="flex-1 flex flex-col relative">
                {/* Header Overlay */}
                <div className="absolute top-4 left-8 z-10">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${backendReady ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                        <span className="text-[10px] font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest transition-colors">
                            {getPageTitle()} {backendReady ? '(Online)' : '(Offline)'}
                        </span>
                    </div>
                </div>

                {/* Upload Overlay for PDF mode when no doc is present */}
                <AnimatePresence>
                    {mode === 'pdf' && !currentDoc && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-x-0 top-16 bottom-24 z-20 flex items-center justify-center p-8 pointer-events-none"
                        >
                            <div className="pointer-events-auto w-full max-w-xl">
                                <Upload onUploadSuccess={handleSelectDoc} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <ChatWindow
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onSummarize={mode === 'pdf' ? handleSummarize : null}
                    onExplainCode={handleExplainCode}
                    loading={loading}
                    currentDoc={currentDoc}
                />
            </main>
        </div>
    );
}
