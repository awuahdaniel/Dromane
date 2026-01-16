import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { humanizeText } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, Wand2, Copy, Check, Repeat } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function Humanizer() {
    const [inputText, setInputText] = useState('');
    const [humanizedText, setHumanizedText] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login', { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate]);

    const handleHumanize = async () => {
        if (!inputText.trim()) return;

        setLoading(true);
        setHumanizedText('');

        try {
            const response = await humanizeText(inputText);
            setHumanizedText(response.answer || response.message);
        } catch (error) {
            setHumanizedText(`**Error**: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(humanizedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
        <div className="flex bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
            <Sidebar />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#F15025] flex items-center justify-center shadow-lg shadow-[#F15025]/20">
                                <UserCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-[#191919] dark:text-white">
                                    Text Humanizer
                                </h1>
                                <p className="text-[#CED0CE] dark:text-[#CED0CE]">
                                    Refine AI-generated content to sound natural and engaging
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Input */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex flex-col h-[600px]"
                        >
                            <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full transition-colors">
                                <div className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700 p-4">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Input Text</h3>
                                </div>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Paste robotic or AI-generated text here..."
                                    className="
                                        flex-1 w-full p-6 resize-none
                                        bg-transparent
                                        text-gray-900 dark:text-white
                                        placeholder:text-gray-400 dark:placeholder:text-slate-500
                                        focus:outline-none leading-relaxed
                                    "
                                    spellCheck="false"
                                />
                                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700">
                                    <button
                                        onClick={handleHumanize}
                                        disabled={!inputText.trim() || loading}
                                        className="
                                            w-full flex items-center justify-center gap-2
                                            px-4 py-3 rounded-xl font-bold transition-all
                                            bg-[#F15025] hover:bg-[#b93a19] text-white
                                            disabled:bg-[#E6E8E6] dark:disabled:bg-[#252525] disabled:cursor-not-allowed disabled:opacity-50
                                            shadow-lg shadow-[#F15025]/20
                                        "
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Humanizing...
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 className="w-4 h-4" />
                                                Humanize Text
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Column - Output */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col h-[600px]"
                        >
                            <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full transition-colors">
                                <div className="bg-[#F8F9F8] dark:bg-[#252525]/50 border-b border-[#E6E8E6] dark:border-[#252525] p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <UserCheck className="w-4 h-4 text-[#F15025]" />
                                        <h3 className="text-sm font-bold text-[#191919] dark:text-white">Humanized Result</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {humanizedText && (
                                            <>
                                                <button
                                                    onClick={handleHumanize}
                                                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                                    title="Regenerate"
                                                >
                                                    <Repeat className="w-4 h-4 text-gray-600 dark:text-slate-300" />
                                                </button>
                                                <button
                                                    onClick={handleCopy}
                                                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                                    title="Copy text"
                                                >
                                                    {copied ? (
                                                        <Check className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <Copy className="w-4 h-4 text-gray-600 dark:text-slate-300" />
                                                    )}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 p-6 overflow-y-auto">
                                    <AnimatePresence mode="wait">
                                        {loading ? (
                                            <motion.div
                                                key="loading"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex flex-col items-center justify-center h-full gap-4"
                                            >
                                                <div className="w-12 h-12 border-4 border-[#F15025] border-t-transparent rounded-full animate-spin" />
                                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                                    Polishing your text...
                                                </p>
                                            </motion.div>
                                        ) : humanizedText ? (
                                            <motion.div
                                                key="result"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="prose prose-sm dark:prose-invert max-w-none"
                                            >
                                                <ReactMarkdown>{String(humanizedText || '')}</ReactMarkdown>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="empty"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex flex-col items-center justify-center h-full gap-4 text-center p-8"
                                            >
                                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-2">
                                                    <Wand2 className="w-8 h-8 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">Ready to humanize</p>
                                                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                                        Input text on the left to get a more natural version
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div >
            </main >
        </div >
    );
}
