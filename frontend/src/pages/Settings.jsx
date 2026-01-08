import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import {
    Sun,
    Moon,
    Monitor,
    User,
    Layout,
    Check
} from 'lucide-react';

export default function Settings() {
    const { theme, setTheme } = useTheme();
    const { user, isLoading } = useAuth();

    const themeOptions = [
        { id: 'light', label: 'Light', icon: <Sun size={20} />, description: 'Classic appearance with bright background.' },
        { id: 'dark', label: 'Dark', icon: <Moon size={20} />, description: 'Better for low light environments.' },
        { id: 'system', label: 'System', icon: <Monitor size={20} />, description: 'Follows your operating system preferences.' }
    ];

    // Defensive rendering
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

            <main className="flex-1 p-8 md:p-12 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-12">
                    {/* Header */}
                    <section>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">Settings</h1>
                        <p className="text-gray-600 dark:text-slate-400 mt-2 transition-colors">Manage your account preferences and application theme.</p>
                    </section>

                    {/* Theme / Appearance Card */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 transition-colors">
                                <Layout size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">Appearance</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {themeOptions.map((opt) => (
                                <motion.button
                                    key={opt.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        console.log('Setting theme to:', opt.id);
                                        setTheme(opt.id);
                                    }}
                                    className={`relative p-6 rounded-3xl border text-left transition-all ${theme === opt.id
                                        ? 'bg-indigo-50 dark:bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10'
                                        : 'bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${theme === opt.id
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                                        }`}>
                                        {opt.icon}
                                    </div>
                                    <h3 className="text-gray-900 dark:text-white font-bold mb-1 transition-colors">{opt.label}</h3>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed transition-colors">{opt.description}</p>

                                    {theme === opt.id && (
                                        <div className="absolute top-4 right-4 text-indigo-500">
                                            <Check size={18} />
                                        </div>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </section>

                    {/* Account Card */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 transition-colors">
                                <User size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">Account Settings</h2>
                        </div>
                        <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-3xl p-8 transition-colors">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-4 border-b border-gray-200 dark:border-slate-800/50 transition-colors">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">Email Address</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 transition-colors">{user?.email || 'No email set'}</p>
                                    </div>
                                    <button className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline transition-colors">Change</button>
                                </div>
                                <div className="flex justify-between items-center py-4 border-b border-gray-200 dark:border-slate-800/50 transition-colors">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">Display Name</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 transition-colors">{user?.name || 'Student'}</p>
                                    </div>
                                    <button className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline transition-colors">Edit</button>
                                </div>
                                <div className="flex justify-between items-center py-4">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">Password</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 transition-colors">Security for your account.</p>
                                    </div>
                                    <button className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline transition-colors">Reset</button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
