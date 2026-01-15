import { useState } from 'react';
import { register } from '../lib/auth';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Github, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.png';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await register(name, email, password);
            navigate('/login', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = () => {
        window.location.href = 'http://localhost:8000/oauth_google.php';
    };

    const handleGithubSignup = () => {
        window.location.href = 'http://localhost:8000/oauth_github.php';
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors">
            {/* Background Decor */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-500/10 dark:bg-red-600/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-orange-500/10 dark:bg-orange-600/10 blur-[120px] rounded-full" />

            <button
                onClick={toggleTheme}
                className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 shadow-lg z-20 hover:scale-105 transition-all"
            >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-gray-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl dark:shadow-2xl relative z-10 transition-colors"
            >
                <div className="text-center mb-8">
                    <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <img src={logo} alt="Dromane.ai" className="w-full h-full object-contain drop-shadow-2xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-tight transition-colors">Create Account</h1>
                    <p className="text-gray-500 dark:text-slate-500 text-sm mt-2 transition-colors">Join the Dromane research community</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 mb-6 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/20 rounded-xl"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Full name"
                            className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-medium"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="email"
                            placeholder="Email address"
                            className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-medium"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-medium"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                        {loading ? 'Creating account...' : (
                            <>
                                Create Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-slate-800 transition-colors"></div></div>
                    <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-white dark:bg-slate-900 px-2 text-gray-400 dark:text-slate-600 font-bold transition-colors">Or sign up with</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={handleGoogleSignup}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl transition-all text-gray-700 dark:text-slate-300 font-medium text-sm"
                        type="button"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </button>
                    <button
                        onClick={handleGithubSignup}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl transition-all text-gray-700 dark:text-slate-300 font-medium text-sm"
                        type="button"
                    >
                        <Github className="w-4 h-4" />
                        GitHub
                    </button>
                </div>

                <p className="mt-8 text-center text-gray-500 dark:text-slate-500 text-sm font-medium transition-colors">
                    Already have an account? <Link to="/login" className="text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 transition-colors">Sign in</Link>
                </p>
            </motion.div>
        </div>
    );
}
