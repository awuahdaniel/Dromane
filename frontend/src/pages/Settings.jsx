import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { updateProfile, changePassword, uploadProfilePicture } from '../lib/api';
import { AUTH_API_URL } from '../lib/config';
import {
    Sun,
    Moon,
    Monitor,
    User,
    Layout,
    Check,
    X,
    Save,
    Lock,
    AlertCircle,
    Camera,
    Upload
} from 'lucide-react';

const ProfileImage = ({ user, uploading, onFileChange }) => {
    const [imgError, setImgError] = useState(false);
    return (
        <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-[#F8F9F8] dark:bg-[#191919] border border-[#E6E8E6] dark:border-[#252525] flex items-center justify-center overflow-hidden shadow-sm">
                {user?.profile_picture && !imgError ? (
                    <img
                        src={`${AUTH_API_URL}/${user.profile_picture}`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <User size={32} className="text-[#CED0CE]" />
                )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#F15025] rounded-lg flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
                {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Camera size={16} />
                )}
                <input type="file" className="hidden" accept="image/*" onChange={onFileChange} disabled={uploading} />
            </label>
        </div>
    );
};

export default function Settings() {
    const { setTheme, theme } = useTheme();
    const { user, isLoading, updateAuth } = useAuth();

    // UI State
    const [editingProfile, setEditingProfile] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Form State
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Feedback State
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [uploadingPic, setUploadingPic] = useState(false);

    const themeOptions = [
        { id: 'light', label: 'Light', icon: <Sun size={20} />, description: 'Classic appearance with bright background.' },
        { id: 'dark', label: 'Dark', icon: <Moon size={20} />, description: 'Better for low light environments.' },
        { id: 'system', label: 'System', icon: <Monitor size={20} />, description: 'Follows your operating system preferences.' }
    ];

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            const data = await updateProfile(name, email);
            setStatus({ type: 'success', message: 'Profile updated successfully!' });
            setEditingProfile(false);
            if (data.user) updateAuth(localStorage.getItem('token'), data.user);
            // Wait a bit to clear success message
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingPic(true);
        setStatus({ type: '', message: '' });

        try {
            const data = await uploadProfilePicture(file);
            setStatus({ type: 'success', message: 'Profile picture updated!' });
            if (data.user) updateAuth(localStorage.getItem('token'), data.user);
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setUploadingPic(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setStatus({ type: 'error', message: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setStatus({ type: 'error', message: 'Password must be at least 6 characters' });
            return;
        }

        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            await changePassword(currentPassword, newPassword);
            setStatus({ type: 'success', message: 'Password changed successfully!' });
            setChangingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset form when opening edit mode
    const startEditing = () => {
        setName(user?.name || '');
        setEmail(user?.email || '');
        setStatus({ type: '', message: '' });
        setEditingProfile(true);
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

            <main className="flex-1 p-8 md:p-12 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-12">
                    {/* Header */}
                    <section className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">Settings</h1>
                            <p className="text-gray-600 dark:text-slate-400 mt-2 transition-colors">Manage your account preferences and application theme.</p>
                        </div>

                        {/* Status Messages Toast */}
                        <AnimatePresence>
                            {status.message && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={`
                                        flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg
                                        ${status.type === 'error'
                                            ? 'bg-red-50 text-red-600 border border-red-200'
                                            : 'bg-green-50 text-green-600 border border-green-200'}
                                    `}
                                >
                                    {status.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
                                    <span className="text-sm font-medium">{status.message}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>

                    {/* Theme / Appearance Card */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#F15025]/10 flex items-center justify-center text-[#F15025] border border-[#F15025]/20 transition-colors">
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
                                    onClick={() => setTheme(opt.id)}
                                    className={`relative p-6 rounded-3xl border text-left transition-all ${theme === opt.id
                                        ? 'bg-[#F15025]/5 dark:bg-[#F15025]/10 border-[#F15025] shadow-lg shadow-[#F15025]/10'
                                        : 'bg-white dark:bg-[#252525]/50 border-[#E6E8E6] dark:border-[#252525] hover:border-[#CED0CE] dark:hover:border-[#252525]'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${theme === opt.id
                                        ? 'bg-[#F15025] text-white'
                                        : 'bg-[#F8F9F8] dark:bg-[#191919] text-[#191919] dark:text-[#E6E8E6]'
                                        }`}>
                                        {opt.icon}
                                    </div>
                                    <h3 className="text-gray-900 dark:text-white font-bold mb-1 transition-colors">{opt.label}</h3>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed transition-colors">{opt.description}</p>

                                    {theme === opt.id && (
                                        <div className="absolute top-4 right-4 text-[#F15025]">
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
                            {/* Profile Info Section */}
                            {!editingProfile ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-6 py-4 border-b border-gray-200 dark:border-slate-800/50 transition-colors">
                                        <ProfileImage user={user} uploading={uploadingPic} onFileChange={handleFileChange} />

                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">{user?.name || 'No Name'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 transition-colors mt-0.5">
                                                        {user?.email || 'No Email'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={startEditing}
                                                    className="text-[#F15025] text-sm font-bold hover:underline transition-colors"
                                                >
                                                    Edit Profile
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Password Section */}
                                    <div className="flex justify-between items-center py-4">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">Password</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 transition-colors">Security for your account.</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setChangingPassword(!changingPassword);
                                                setStatus({ type: '', message: '' });
                                            }}
                                            className="text-[#F15025] text-sm font-bold hover:underline transition-colors"
                                        >
                                            {changingPassword ? 'Cancel' : 'Change'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Edit Profile Form */
                                <form onSubmit={handleProfileUpdate} className="space-y-4 py-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Display Name</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full p-3 rounded-xl bg-[#F8F9F8] dark:bg-[#252525] border border-[#E6E8E6] dark:border-[#252525] text-[#191919] dark:text-white focus:ring-2 focus:ring-[#F15025] outline-none transition-all"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Email Address</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full p-3 rounded-xl bg-[#F8F9F8] dark:bg-[#252525] border border-[#E6E8E6] dark:border-[#252525] text-[#191919] dark:text-white focus:ring-2 focus:ring-[#F15025] outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setEditingProfile(false)}
                                            className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-6 py-2 rounded-xl text-sm font-bold bg-[#F15025] text-white hover:bg-[#b93a19] transition-all shadow-lg shadow-[#F15025]/20 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Change Password Form */}
                            <AnimatePresence>
                                {changingPassword && !editingProfile && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <form onSubmit={handlePasswordChange} className="pt-6 border-t border-gray-200 dark:border-slate-800/50 mt-4 space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Current Password</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                    <input
                                                        type="password"
                                                        value={currentPassword}
                                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                                        className="w-full p-3 pl-10 rounded-xl bg-[#F8F9F8] dark:bg-[#252525] border border-[#E6E8E6] dark:border-[#252525] text-[#191919] dark:text-white focus:ring-2 focus:ring-[#F15025] outline-none transition-all"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">New Password</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                        <input
                                                            type="password"
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            className="w-full p-3 pl-10 rounded-xl bg-[#F8F9F8] dark:bg-[#252525] border border-[#E6E8E6] dark:border-[#252525] text-[#191919] dark:text-white focus:ring-2 focus:ring-[#F15025] outline-none transition-all"
                                                            required
                                                            minLength={6}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Confirm Password</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                        <input
                                                            type="password"
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            className="w-full p-3 pl-10 rounded-xl bg-[#F8F9F8] dark:bg-[#252525] border border-[#E6E8E6] dark:border-[#252525] text-[#191919] dark:text-white focus:ring-2 focus:ring-[#F15025] outline-none transition-all"
                                                            required
                                                            minLength={6}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end pt-2">
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="px-6 py-2 rounded-xl text-sm font-bold bg-[#F15025] text-white hover:bg-[#b93a19] transition-all shadow-lg shadow-[#F15025]/20 disabled:opacity-50"
                                                >
                                                    {isSubmitting ? 'Updating...' : 'Update Password'}
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>
                </div>
            </main >
        </div >
    );
}
