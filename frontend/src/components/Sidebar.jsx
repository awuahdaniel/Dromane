import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Search,
    FileText,
    Code,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    User
} from 'lucide-react';
import { logout } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { getDocuments } from '../lib/api';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const [documents, setDocuments] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, clearAuth, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            getDocuments()
                .then(setDocuments)
                .catch(err => console.error("Failed to load documents", err));
        }
    }, [isAuthenticated]);

    const navItems = [
        { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { title: 'Research', icon: <Search size={20} />, path: '/dashboard/research' },
        { title: 'PDF Chat', icon: <FileText size={20} />, path: '/dashboard/pdf' },
        { title: 'Code Expert', icon: <Code size={20} />, path: '/dashboard/code' },
        { title: 'Settings', icon: <Settings size={20} />, path: '/settings' },
    ];

    const handleLogout = () => {
        if (confirm('Are you sure you want to log out?')) {
            logout(navigate, clearAuth);
        }
    };

    return (
        <motion.div
            initial={false}
            animate={{ width: isOpen ? 280 : 80 }}
            className="h-screen bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-slate-300 flex flex-col border-r border-gray-200 dark:border-slate-800 transition-all duration-300 ease-in-out relative group shrink-0"
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute -right-3 top-10 bg-indigo-600 rounded-full p-1 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50"
            >
                {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>

            {/* Brand */}
            <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                    <span className="text-white font-bold text-xl">D</span>
                </div>
                {isOpen && (
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-bold text-xl text-gray-900 dark:text-white tracking-tight"
                    >
                        Dromane<span className="text-indigo-500">.ai</span>
                    </motion.h1>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-4 space-y-8 mt-4">
                {/* Core Navigation */}
                <section>
                    {isOpen && <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">Main Menu</p>}
                    <div className="space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${location.pathname === item.path
                                    ? 'bg-indigo-100 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-200 dark:border-indigo-500/20'
                                    : 'hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-200 border border-transparent'
                                    }`}
                            >
                                <div className={location.pathname === item.path ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'}>
                                    {item.icon}
                                </div>
                                {isOpen && <span className="text-sm font-medium">{item.title}</span>}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Knowledge Base (PDFs) */}
                {documents.length > 0 && (
                    <section>
                        {isOpen && <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">Library</p>}
                        <div className="space-y-1">
                            {documents.slice(0, 5).map((doc) => (
                                <button
                                    key={doc.id}
                                    onClick={() => navigate(`/dashboard/pdf?id=${doc.id}`)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-200 transition-all border border-transparent text-gray-400 dark:text-slate-500"
                                >
                                    <FileText size={18} />
                                    {isOpen && <span className="text-sm truncate">{doc.filename}</span>}
                                </button>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* User Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                <div className={`flex items-center gap-3 p-2 rounded-xl transition-all ${isOpen ? 'hover:bg-gray-100 dark:hover:bg-slate-800' : 'justify-center'}`}>
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-slate-500 border border-gray-300 dark:border-slate-700 shrink-0 shadow-sm">
                        <User size={16} />
                    </div>
                    {isOpen && (
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user?.name || 'Student'}</p>
                            <p className="text-[10px] text-gray-500 dark:text-slate-500 truncate">{user?.email || 'student@dromane.ai'}</p>
                        </div>
                    )}
                </div>

                <div className="mt-4 space-y-1">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-red-400/60 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/5 transition-all ${isOpen ? '' : 'justify-center'}`}
                    >
                        <LogOut size={18} />
                        {isOpen && <span className="text-sm font-medium">Log Out</span>}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
