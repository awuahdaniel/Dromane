import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { updateAuth } = useAuth();
    const [status, setStatus] = useState('Processing...');
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = searchParams.get('token');
        const provider = searchParams.get('provider');
        const errorMsg = searchParams.get('error');

        console.log('AuthCallback: token received:', token ? 'yes' : 'no');
        console.log('AuthCallback: provider:', provider);

        if (errorMsg) {
            setError(decodeURIComponent(errorMsg));
            setStatus('Authentication failed');
            setTimeout(() => navigate('/login', { replace: true }), 3000);
            return;
        }

        if (!token) {
            setError('No authentication token received');
            setStatus('Authentication failed');
            setTimeout(() => navigate('/login', { replace: true }), 3000);
            return;
        }

        try {
            // Decode the JWT to extract user info (without verification - PHP already verified)
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid token format');
            }

            const payload = JSON.parse(atob(parts[1]));
            const user = payload.data;

            if (!user || !user.id) {
                throw new Error('Invalid user data in token');
            }

            // Store token and user
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Update auth context
            updateAuth(token, user);

            setStatus('Success! Redirecting...');

            // Redirect to dashboard
            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 500);

        } catch (err) {
            console.error('AuthCallback error:', err);
            setError(err.message || 'Failed to process authentication');
            setStatus('Authentication failed');
            setTimeout(() => navigate('/login', { replace: true }), 3000);
        }
    }, [searchParams, navigate, updateAuth]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
            <div className="max-w-md w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-gray-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl dark:shadow-2xl text-center transition-colors">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
                    <span className="text-white font-bold text-3xl">D</span>
                </div>

                {error ? (
                    <>
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                            <svg className="w-6 h-6 text-red-600 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">{status}</h2>
                        <p className="text-red-600 dark:text-red-400 text-sm mb-4 transition-colors">{error}</p>
                        <p className="text-gray-500 dark:text-slate-500 text-xs transition-colors">Redirecting to login...</p>
                    </>
                ) : (
                    <>
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">{status}</h2>
                        <p className="text-gray-500 dark:text-slate-400 text-sm transition-colors">Please wait while we complete your sign-in.</p>
                    </>
                )}
            </div>
        </div>
    );
}
