import { useState } from 'react';
import { Code, Send, Clipboard, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const LANGUAGES = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'sql', label: 'SQL' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
];

export default function CodeEditor({ onSubmit, loading }) {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [copied, setCopied] = useState(false);

    const handleSubmit = () => {
        if (code.trim() && onSubmit) {
            onSubmit(code, language);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const lineCount = code.split('\n').length;
    const charCount = code.length;

    const placeholderCode = {
        javascript: '// Paste your JavaScript code here\nfunction example() {\n  console.log("Hello World");\n}',
        python: '# Paste your Python code here\ndef example():\n    print("Hello World")',
        java: '// Paste your Java code here\npublic class Example {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
        cpp: '// Paste your C++ code here\n#include <iostream>\n\nint main() {\n    std::cout << "Hello World";\n    return 0;\n}',
    };

    return (
        <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors">
            {/* Header */}
            <div className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
                        <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Code Editor</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                            {lineCount} lines · {charCount} characters
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Language Selector */}
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="
                            px-3 py-1.5 rounded-lg text-sm font-medium
                            bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600
                            text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                            transition-colors
                        "
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.value} value={lang.value}>
                                {lang.label}
                            </option>
                        ))}
                    </select>

                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        disabled={!code}
                        className="
                            p-2 rounded-lg transition-all
                            bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600
                            text-gray-600 dark:text-slate-300
                            disabled:opacity-50 disabled:cursor-not-allowed
                        "
                        title="Copy code"
                    >
                        {copied ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                            <Clipboard className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Code Input Area */}
            <div className="relative">
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={placeholderCode[language] || '// Paste your code here...'}
                    className="
                        w-full h-96 p-4 pl-16 resize-none
                        bg-white dark:bg-slate-900/50
                        text-gray-900 dark:text-white
                        font-mono text-sm leading-relaxed
                        focus:outline-none
                        placeholder:text-gray-400 dark:placeholder:text-slate-500
                        transition-colors
                    "
                    spellCheck="false"
                />

                {/* Line Numbers (optional enhancement) */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-50 dark:bg-slate-800/30 border-r border-gray-200 dark:border-slate-700 overflow-hidden pointer-events-none">
                    {Array.from({ length: lineCount }, (_, i) => (
                        <div
                            key={i}
                            className="px-2 text-xs text-gray-400 dark:text-slate-500 text-right leading-relaxed"
                            style={{ height: '21px' }}
                        >
                            {i + 1}
                        </div>
                    ))}
                </div>

                <div className="ml-12" /> {/* Spacer for line numbers */}
            </div>

            {/* Footer with Submit Button */}
            <div className="bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 p-4">
                <button
                    onClick={handleSubmit}
                    disabled={!code.trim() || loading}
                    className="
                        w-full flex items-center justify-center gap-2
                        px-4 py-3 rounded-xl font-bold transition-all
                        bg-indigo-600 hover:bg-indigo-500 text-white
                        disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50
                        shadow-lg shadow-indigo-500/20
                    "
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Explain Code
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
