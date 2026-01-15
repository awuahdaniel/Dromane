import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { performResearch } from '../lib/api';
import { motion } from 'framer-motion';
import { Search, Lightbulb, Download, ExternalLink } from 'lucide-react';

const SUGGESTED_TOPICS = [
    {
        category: 'Science',
        questions: [
            'Explain quantum entanglement in simple terms',
            'How does CRISPR gene editing work?',
            'What is the current state of fusion energy research?'
        ]
    },
    {
        category: 'Technology',
        questions: [
            'Explain how neural networks learn',
            'What is blockchain technology?',
            'How do large language models like GPT work?'
        ]
    },
    {
        category: 'Mathematics',
        questions: [
            'Explain the Riemann Hypothesis',
            'What are imaginary numbers used for?',
            'How does the RSA encryption algorithm work?'
        ]
    },
    {
        category: 'History',
        questions: [
            'What led to the fall of the Roman Empire?',
            'Explain the causes of World War I',
            'How did the Renaissance change Europe?'
        ]
    }
];

export default function ResearchAssistant() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login', { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate]);

    useEffect(() => {
        // Welcome message
        if (messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: `# Welcome to the Research Assistant! 🔍

I'm here to help you explore complex topics and answer your research questions. I can:

- **Explain** complex concepts in simple terms
- **Analyze** theories and ideas
- **Compare** different perspectives
- **Provide** detailed information on various topics

Try one of the suggested questions below or ask me anything!`
            }]);
        }
    }, []);

    const handleSendMessage = async (input) => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);

        try {
            const response = await performResearch(input);

            let content = response.answer;

            if (response.sources && response.sources.length > 0) {
                content += "\n\n---\n### Sources\n";
                content += response.sources.map(s =>
                    `[${s.id}] [${s.title}](${s.url})`
                ).join("\n\n");
            }

            const botMessage = {
                role: 'assistant',
                content: content
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'system',
                content: `**Research Error**: ${error.message}`
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestedQuestion = (question) => {
        handleSendMessage(question);
    };

    const handleExportChat = () => {
        const chatText = messages
            .filter(m => m.role !== 'system')
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n\n---\n\n');

        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `research-chat-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="flex bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </main>
            </div>
        );
    }

    return (
        <div className="flex bg-gray-50 dark:bg-slate-950 h-screen overflow-hidden transition-colors">
            <Sidebar>
                {/* Topics Panel */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-3 px-2">
                        Suggested Topics
                    </h3>

                    {SUGGESTED_TOPICS.map((topic, index) => (
                        <motion.div
                            key={topic.category}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="space-y-2"
                        >
                            <div className="flex items-center gap-2 px-2">
                                <Lightbulb className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                <h4 className="text-xs font-bold text-gray-700 dark:text-slate-300">
                                    {topic.category}
                                </h4>
                            </div>

                            {topic.questions.map((question, qIndex) => (
                                <button
                                    key={qIndex}
                                    onClick={() => handleSuggestedQuestion(question)}
                                    disabled={loading}
                                    className="
                                        w-full text-left p-3 rounded-xl transition-all text-sm
                                        bg-white dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10
                                        border border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/30
                                        text-gray-700 dark:text-slate-300
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                    "
                                >
                                    {question}
                                </button>
                            ))}
                        </motion.div>
                    ))}
                </div>

                {/* Export Button */}
                {messages.length > 1 && (
                    <button
                        onClick={handleExportChat}
                        className="
                            m-4 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
                            bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20
                            text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30
                        "
                    >
                        <Download className="w-4 h-4" />
                        Export Chat
                    </button>
                )}
            </Sidebar>

            <main className="flex-1 flex flex-col relative">
                {/* Header */}
                <div className="absolute top-4 left-8 z-10 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                            Research Assistant
                        </span>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                AI Online
                            </span>
                        </div>
                    </div>
                </div>

                {/* Chat Window */}
                <ChatWindow
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    loading={loading}
                    placeholder="Ask me anything about your research topic..."
                />
            </main>
        </div>
    );
}
