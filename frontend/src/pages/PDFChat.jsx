import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import Upload from '../components/Upload';
import DocumentList from '../components/DocumentList';
import { sendChatMessage, summarizeDocument, clearDocuments } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X } from 'lucide-react';

export default function PDFChat() {
    const [messages, setMessages] = useState([]);
    const [currentDoc, setCurrentDoc] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showUpload, setShowUpload] = useState(true);
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login', { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate]);

    const handleUploadSuccess = (doc) => {
        setDocuments(prev => [...prev, doc]);
        setCurrentDoc(doc);
        setShowUpload(false);
        setMessages(prev => [...prev, {
            role: 'system',
            content: `✅ **${doc?.filename || 'Document'}** uploaded successfully! You can now ask questions about this document.`
        }]);
    };

    const handleSelectDoc = (doc) => {
        setCurrentDoc(doc);
        setMessages(prev => [...prev, {
            role: 'system',
            content: `📄 Switched to: **${doc?.filename || 'Document'}**`
        }]);
    };

    const handleDeleteDoc = async (doc) => {
        if (confirm(`Delete "${doc.filename}"?`)) {
            setDocuments(prev => prev.filter(d => d.filename !== doc.filename));
            if (currentDoc?.filename === doc.filename) {
                setCurrentDoc(null);
                setMessages([]);
            }
        }
    };

    const handleSendMessage = async (input) => {
        if (!input.trim()) return;

        if (!currentDoc) {
            setMessages(prev => [...prev, {
                role: 'system',
                content: '⚠️ Please upload a PDF document first to use this feature.'
            }]);
            setShowUpload(true);
            return;
        }

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);

        try {
            const response = await sendChatMessage(input);
            const botMessage = {
                role: 'assistant',
                content: response?.answer || response?.message || 'Sorry, I couldn\'t generate a response.'
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'system',
                content: `**Error**: ${error.message}`
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSummarize = async () => {
        if (!currentDoc || loading) return;

        setMessages(prev => [...prev, {
            role: 'system',
            content: '📝 *Generating document summary...*'
        }]);
        setLoading(true);

        try {
            const response = await summarizeDocument();
            const summary = response?.summary || response?.answer || 'Failed to generate summary.';
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `### 📄 Document Summary\n\n${summary}`
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'system',
                content: `**Error**: ${error.message}`
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = async () => {
        if (confirm('Clear all documents and chat history?')) {
            try {
                await clearDocuments();
                setDocuments([]);
                setCurrentDoc(null);
                setMessages([]);
                setShowUpload(true);
            } catch (error) {
                alert('Failed to clear history: ' + error.message);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-[#F15025] border-t-transparent rounded-full animate-spin" />
                </main>
            </div>
        );
    }

    return (
        <div className="flex bg-gray-50 dark:bg-slate-950 h-screen overflow-hidden transition-colors">
            <Sidebar>
                <div className="flex-1 overflow-y-auto">
                    <DocumentList
                        documents={documents}
                        currentDoc={currentDoc}
                        onSelectDoc={handleSelectDoc}
                        onDeleteDoc={handleDeleteDoc}
                    />
                </div>
                {documents.length > 0 && (
                    <button
                        onClick={handleClearHistory}
                        className="
                            m-4 px-4 py-2 rounded-xl text-sm font-medium transition-all
                            bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20
                            text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30
                        "
                    >
                        Clear All
                    </button>
                )}
            </Sidebar>

            <main className="flex-1 flex flex-col relative">
                {/* Header */}
                {/* Header */}
                <div className="absolute top-16 md:top-4 left-4 md:left-8 z-10 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 pointer-events-none md:pointer-events-auto">
                    <div className="flex items-center gap-2 pointer-events-auto">
                        <FileText className="w-5 h-5 text-[#F15025]" />
                        <span className="text-lg font-bold text-[#191919] dark:text-white">
                            PDF Research Assistant
                        </span>
                    </div>
                    {currentDoc && (
                        <div className="px-3 py-1 rounded-full bg-[#F15025]/10 border border-[#F15025]/30 w-fit pointer-events-auto">
                            <span className="text-xs font-medium text-[#F15025]">
                                {currentDoc.filename}
                            </span>
                        </div>
                    )}
                </div>

                {/* Upload Modal */}
                <AnimatePresence>
                    {showUpload && !currentDoc && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-20 flex items-center justify-center p-8"
                            onClick={() => setShowUpload(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="w-full max-w-xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="relative">
                                    <button
                                        onClick={() => setShowUpload(false)}
                                        className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-white dark:bg-slate-800 shadow-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                                    </button>
                                    <Upload onUploadSuccess={handleUploadSuccess} />
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Chat Window */}
                <ChatWindow
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onSummarize={currentDoc ? handleSummarize : null}
                    loading={loading}
                    currentDoc={currentDoc}
                    placeholder={currentDoc ? "Ask a question about the document..." : "Upload a PDF to get started"}
                />

                {/* Upload Button (when doc exists) */}
                {currentDoc && (
                    <button
                        onClick={() => setShowUpload(true)}
                        className="
                            absolute top-16 md:top-4 right-4 md:right-8 z-10
                            px-4 py-2 rounded-xl text-sm font-medium transition-all
                            bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700
                            text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700
                            shadow-lg
                        "
                    >
                        Upload Another PDF
                    </button>
                )}
            </main>
        </div>
    );
}
