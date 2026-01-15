import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
    Send,
    Bot,
    User,
    Sparkles,
    Terminal,
    Copy,
    Check,
    Zap,
    Quote
} from 'lucide-react';

export default function ChatWindow({ messages, onSendMessage, onSummarize, onExplainCode, loading, currentDoc }) {
    const [input, setInput] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && !loading) {
            onSendMessage(input);
            setInput('');
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="flex-1 flex flex-col h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-200 relative overflow-hidden transition-colors">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10 dark:opacity-20">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-400 dark:bg-indigo-600/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-purple-400 dark:bg-purple-600/20 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <header className="h-16 border-b border-gray-200 dark:border-slate-800/50 flex items-center justify-between px-8 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-600/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 transition-colors">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white transition-colors">Research Assistant</h2>
                        <p className="text-[10px] text-gray-500 dark:text-slate-500 flex items-center gap-1 uppercase tracking-wider transition-colors">
                            {currentDoc ? (
                                <>
                                    <Sparkles size={10} className="text-indigo-500 dark:text-indigo-400" />
                                    Context: {currentDoc.filename}
                                </>
                            ) : (
                                'General Intelligence'
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onExplainCode}
                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-md transition-all flex items-center gap-2 text-gray-700 dark:text-slate-300"
                    >
                        <Terminal size={12} />
                        Explain Code
                    </button>
                    <button
                        onClick={onSummarize}
                        disabled={!currentDoc || loading}
                        className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Zap size={12} />
                        Summarize
                    </button>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-20 py-10 space-y-8 custom-scrollbar relative z-0">
                <AnimatePresence initial={false}>
                    {messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto opacity-50"
                        >
                            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-gray-400 dark:text-slate-700 border border-gray-200 dark:border-slate-800 transition-colors">
                                <Quote size={40} />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white transition-colors">How can I help you today?</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-500 mt-2 transition-colors">Upload a research paper or just start a conversation about your code snippets.</p>
                            </div>
                        </motion.div>
                    ) : (
                        messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                                    }`}>
                                    {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                                </div>

                                <div className={`flex flex-col space-y-1 ${msg.role === 'user' ? 'items-end' : ''}`}>
                                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-2xl break-words prose dark:prose-invert ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800/50 text-gray-800 dark:text-slate-300'
                                        }`}>
                                        <ReactMarkdown>{String(msg.content || '')}</ReactMarkdown>
                                    </div>
                                    {msg.role === 'assistant' && (
                                        <button
                                            onClick={() => handleCopy(msg.content)}
                                            className="text-[10px] text-gray-400 dark:text-slate-600 hover:text-gray-600 dark:hover:text-slate-400 flex items-center gap-1 mt-1 px-1 transition-colors"
                                        >
                                            {isCopied ? <Check size={10} /> : <Copy size={10} />}
                                            {isCopied ? 'Copied' : 'Copy response'}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-4"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 flex items-center justify-center animate-pulse transition-colors">
                            <Bot size={18} />
                        </div>
                        <div className="flex gap-1 py-4">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                        </div>
                    </motion.div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="max-w-4xl mx-auto w-full px-4 mb-8 z-10">
                <form
                    onSubmit={handleSubmit}
                    className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-slate-800 rounded-2xl p-2 shadow-lg dark:shadow-2xl flex items-center gap-2 group focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50 transition-all"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={currentDoc ? `Ask about "${currentDoc.filename}"...` : "Message Dromane assistant..."}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 py-2 placeholder-gray-400 dark:placeholder-slate-600 text-gray-900 dark:text-white transition-colors"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${!input.trim() || loading
                            ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 opacity-50'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30'
                            }`}
                    >
                        <Send size={18} />
                    </button>
                </form>
                <p className="text-[10px] text-center text-gray-400 dark:text-slate-600 mt-3 font-medium uppercase tracking-widest transition-colors">
                    Powered by Dromane Intelligence Engine
                </p>
            </div>
        </div>
    );
}
