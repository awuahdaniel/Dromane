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
    User,
    AlignLeft,
    UserCheck
} from 'lucide-react';
import { logout } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { getDocuments } from '../lib/api';
import { AUTH_API_URL } from '../lib/config';
import logo from '../assets/logo.png';

const SidebarAvatar = ({ user }) => {
    const [imgError, setImgError] = useState(false);

    // Reset error when user picture changes
    useEffect(() => {
        setImgError(false);
    }, [user?.profile_picture]);

    if (user?.profile_picture && !imgError) {
        return (
            <img
                src={`${AUTH_API_URL}/${user.profile_picture}`}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
            />
        );
    }
    return <User size={16} />;
};

export default function Sidebar({ children }) {
    const [isOpen, setIsOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [documents, setDocuments] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, clearAuth, isAuthenticated } = useAuth();

    // Handle Resize & Initial Mobile State
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                setIsOpen(false);
            } else {
                setIsOpen(true);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close on navigation if mobile
    useEffect(() => {
        if (isMobile) {
            setIsOpen(false);
        }
    }, [location.pathname, isMobile]);

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
        { title: 'Summarizer', icon: <AlignLeft size={20} />, path: '/dashboard/summarizer' },
        { title: 'Humanizer', icon: <UserCheck size={20} />, path: '/dashboard/humanizer' },
        { title: 'Settings', icon: <Settings size={20} />, path: '/settings' },
    ];

    const handleLogout = () => {
        if (confirm('Are you sure you want to log out?')) {
            logout(navigate, clearAuth);
        }
    };

    return (
        <>
            {/* Mobile Toggle Button (Visible when sidebar is closed on mobile) */}
            {isMobile && !isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed top-4 left-4 z-40 bg-white dark:bg-[#252525] p-2 rounded-lg text-[#191919] dark:text-[#E6E8E6] shadow-md border border-[#E6E8E6] dark:border-[#333]"
                >
                    <AlignLeft size={20} />
                </button>
            )}

            {/* Mobile Overlay */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <motion.div
                initial={false}
                animate={{
                    width: isOpen ? 280 : (isMobile ? 0 : 80),
                    x: isMobile && !isOpen ? -280 : 0
                }}
                className={`
                    h-screen bg-[#F8F9F8] dark:bg-[#191919]
                    text-[#191919] dark:text-[#E6E8E6]
                    flex flex-col border-r border-[#E6E8E6] dark:border-[#252525]
                    transition-all duration-300 ease-in-out
                    flex-shrink-0 z-50
                    ${isMobile ? 'fixed top-0 left-0 shadow-2xl' : 'relative'}
                `}
            >
                {/* Toggle Button (Desktop Only) */}
                {!isMobile && (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="absolute -right-3 top-10 bg-[#F15025] rounded-full p-1 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50"
                    >
                        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                )}

                {/* Brand */}
                <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                        <img src={logo} alt="Dromane.ai" className="w-full h-full object-contain" />
                    </div>
                    {isOpen && (
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-bold text-xl text-[#191919] dark:text-white tracking-tight"
                        >
                            Dromane<span className="text-[#F15025]">.ai</span>
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
                                        ? 'bg-[#F15025]/10 text-[#F15025] shadow-sm border border-[#F15025]/20'
                                        : 'hover:bg-[#E6E8E6] dark:hover:bg-[#252525] hover:text-[#191919] dark:hover:text-white border border-transparent'
                                        }`}
                                >
                                    <div className={location.pathname === item.path ? 'text-[#F15025]' : 'text-[#CED0CE]'}>
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
                                {Array.isArray(documents) && documents.slice(0, 5).map((doc) => (
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

                    {/* Additional Sidebar Content (Children) */}
                    {children}
                </div>

                {/* User Footer */}
                <div className="p-4 border-t border-[#E6E8E6] dark:border-[#252525] bg-[#F8F9F8]/50 dark:bg-[#191919]/50">
                    <div className={`flex items-center gap-3 p-2 rounded-xl transition-all ${isOpen ? 'hover:bg-[#E6E8E6] dark:hover:bg-[#252525]' : 'justify-center'}`}>
                        <div className="w-8 h-8 rounded-full bg-[#E6E8E6] dark:bg-[#252525] flex items-center justify-center text-[#CED0CE] dark:text-[#E6E8E6] border border-[#CED0CE] dark:border-[#252525] shrink-0 shadow-sm overflow-hidden">
                            <SidebarAvatar user={user} />
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
        </>
    );
}
