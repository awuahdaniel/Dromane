import React from 'react';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('React Error Boundary caught an error:', error, errorInfo);
    }

    toggleTheme() {
        // Simple manual toggle solely for the fallback UI if needed in emergency
        document.documentElement.classList.toggle('dark');
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#F8F9F8] dark:bg-[#191919] flex items-center justify-center p-8 transition-colors">
                    <div className="max-w-md w-full bg-white dark:bg-[#191919] border border-red-200 dark:border-red-500/20 rounded-2xl p-8 text-center shadow-xl transition-colors">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
                            <svg className="w-8 h-8 text-red-600 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Something went wrong</h2>
                        <p className="text-gray-600 dark:text-slate-400 text-sm mb-6 transition-colors">
                            The application encountered an unexpected error. Please try again.
                        </p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.href = '/dashboard';
                            }}
                            className="w-full py-3 px-4 bg-[#F15025] hover:bg-[#b93a19] text-white font-medium rounded-xl transition-colors shadow-lg shadow-[#F15025]/20"
                        >
                            Return to Dashboard
                        </button>
                        <button
                            onClick={() => {
                                localStorage.clear();
                                window.location.href = '/login';
                            }}
                            className="w-full mt-3 py-3 px-4 bg-[#F8F9F8] dark:bg-[#252525] hover:bg-[#E6E8E6] dark:hover:bg-[#252525] text-[#191919] dark:text-[#E6E8E6] font-medium rounded-xl transition-colors"
                        >
                            Log Out & Retry
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
