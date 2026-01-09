import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import CodeEditor from '../components/CodeEditor';
import { explainCode } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Sparkles, BookOpen, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const EXAMPLE_CODES = [
    {
        language: 'javascript',
        title: 'Async/Await Example',
        code: `async function fetchUserData(userId) {
    try {
        const response = await fetch(\`/api/users/\${userId}\`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
}`
    },
    {
        language: 'python',
        title: 'List Comprehension',
        code: `# Filter and transform a list
numbers = [1, 2, 3, 4, 5, 6]
squared_evens = [x**2 for x in numbers if x % 2 == 0]
print(squared_evens)  # [4, 16, 36]`
    },
    {
        language: 'python',
        title: 'Decorator Pattern',
        code: `def timer_decorator(func):
    def wrapper(*args, **kwargs):
        import time
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.2f}s")
        return result
    return wrapper`
    }
];

export default function CodeAnalyzer() {
    const [explanation, setExplanation] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login', { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate]);

    const handleCodeSubmit = async (code, language) => {
        setLoading(true);
        setExplanation('');

        try {
            const codeWithContext = `Language: ${language}\n\n${code}`;
            const response = await explainCode(codeWithContext);
            setExplanation(response.answer || response.message);
        } catch (error) {
            setExplanation(`**Error**: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyExplanation = () => {
        navigator.clipboard.writeText(explanation);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <Code2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                    Code Analyzer
                                </h1>
                                <p className="text-gray-600 dark:text-slate-400">
                                    Get line-by-line explanations and optimization tips
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Code Editor */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <CodeEditor
                                onSubmit={handleCodeSubmit}
                                loading={loading}
                            />

                            {/* Example Codes */}
                            <div className="mt-6 bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 transition-colors">
                                <div className="flex items-center gap-2 mb-4">
                                    <BookOpen className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                        Example Code Snippets
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {EXAMPLE_CODES.map((example, index) => (
                                        <button
                                            key={index}
                                            className="
                                                w-full text-left p-3 rounded-xl transition-all
                                                bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800
                                                border border-gray-200 dark:border-slate-700
                                                group
                                            "
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {example.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                        {example.language}
                                                    </p>
                                                </div>
                                                <Sparkles className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Column - Explanation */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-4"
                        >
                            <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors">
                                {/* Header */}
                                <div className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                            AI Explanation
                                        </h3>
                                    </div>
                                    {explanation && (
                                        <button
                                            onClick={handleCopyExplanation}
                                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                            title="Copy explanation"
                                        >
                                            {copied ? (
                                                <Check className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <Copy className="w-4 h-4 text-gray-600 dark:text-slate-300" />
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6 min-h-[500px] max-h-[calc(100vh-300px)] overflow-y-auto">
                                    <AnimatePresence mode="wait">
                                        {loading ? (
                                            <motion.div
                                                key="loading"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex flex-col items-center justify-center h-64 gap-4"
                                            >
                                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                                    Analyzing your code...
                                                </p>
                                            </motion.div>
                                        ) : explanation ? (
                                            <motion.div
                                                key="explanation"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="prose prose-sm dark:prose-invert max-w-none"
                                            >
                                                <ReactMarkdown>{explanation}</ReactMarkdown>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="empty"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex flex-col items-center justify-center h-64 gap-4"
                                            >
                                                <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <Code2 className="w-10 h-10 text-gray-400 dark:text-slate-500" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        Paste your code and click "Explain Code"
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                        Get detailed explanations and optimization tips
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
