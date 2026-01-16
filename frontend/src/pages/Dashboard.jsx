import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import {
    ShieldCheck,
    FileText,
    Code,
    Search,
    ArrowRight,
    Sparkles,
    Cpu,
    UserCheck
} from 'lucide-react';

const tools = [
    {
        title: 'Research Assistant',
        description: 'Ask deep questions about complex topics. Uses our core AI intelligence engine.',
        icon: <Search className="text-blue-500" />,
        path: '/dashboard/research',
        color: 'blue'
    },
    {
        title: 'PDF Reader & Chat',
        description: 'Upload research papers and chat directly with them using RAG technology.',
        icon: <FileText className="text-indigo-500" />,
        path: '/dashboard/pdf',
        color: 'indigo'
    },
    {
        title: 'Code Analyzer',
        description: 'Paste code snippets for line-by-line explanation and optimization tips.',
        icon: <Code className="text-purple-500" />,
        path: '/dashboard/code',
        color: 'purple'
    },
    {
        title: 'Text Summarizer',
        description: 'Condense long articles and documents into concise key insights.',
        icon: <FileText className="text-orange-500" />,
        path: '/dashboard/summarizer',
        color: 'orange'
    },
    {
        title: 'Text Humanizer',
        description: 'Refine AI content to sound more natural and engaging.',
        icon: <UserCheck className="text-teal-500" />,
        path: '/dashboard/humanizer',
        color: 'teal'
    }
];

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();

    // Defensive rendering
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
                <div className="space-y-12">
                    {/* Hero Section */}
                    <section className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#F15025]/10 border border-[#F15025]/20 text-[#F15025] text-xs font-bold w-fit uppercase tracking-tighter"
                        >
                            <Sparkles size={14} />
                            Welcome back{user?.name ? `, ${user.name}` : ''}
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-extrabold text-[#191919] dark:text-white tracking-tight transition-colors"
                        >
                            What shall we <span className="text-[#F15025]">solve</span> today?
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-600 dark:text-slate-400 max-w-2xl text-lg transition-colors"
                        >
                            Your unified workspace for research and AI-powered coding. Select a tool below to get started.
                        </motion.p>
                    </section>

                    {/* Tools Grid */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {tools.map((tool, idx) => (
                            <motion.div
                                key={tool.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + (idx * 0.1) }}
                                onClick={() => navigate(tool.path)}
                                className="group cursor-pointer bg-white dark:bg-[#191919] border border-[#E6E8E6] dark:border-[#252525] p-8 rounded-3xl hover:border-[#F15025]/30 hover:bg-[#F8F9F8] dark:hover:bg-[#252525] transition-all shadow-lg dark:shadow-2xl relative overflow-hidden"
                            >
                                {/* Hover Accent */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F15025]/5 blur-3xl group-hover:bg-[#F15025]/10 transition-colors" />

                                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg border border-gray-200 dark:border-slate-700">
                                    {tool.icon}
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">{tool.title}</h3>
                                <p className="text-gray-500 dark:text-slate-500 text-sm leading-relaxed mb-6 transition-colors">
                                    {tool.description}
                                </p>

                                <div className="flex items-center gap-2 text-[#F15025] font-bold text-sm">
                                    Open Tool <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </motion.div>
                        ))}
                    </section>
                </div>
            </main>
        </div>
    );
}
