import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    ArrowRight,
    BookOpen,
    FileText,
    Code2,
    Sparkles,
    CheckCircle2,
    Shield,
    Zap
} from 'lucide-react';
import logo from '../assets/logo.png';

export default function Landing() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            setMousePosition({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const features = [
        {
            icon: <BookOpen size={24} />,
            title: "Research Made Simple",
            description: "Access comprehensive research tools that help you find, analyze, and cite information from trusted sources across the web."
        },
        {
            icon: <FileText size={24} />,
            title: "Document Intelligence",
            description: "Upload PDFs and documents to extract insights, generate summaries, and get instant answers to your questions about the content."
        },
        {
            icon: <Code2 size={24} />,
            title: "Code Understanding",
            description: "Paste code snippets to receive detailed explanations, debugging help, and optimization suggestions in plain language."
        },
        {
            icon: <Sparkles size={24} />,
            title: "Content Enhancement",
            description: "Refine your writing with tools that improve clarity, tone, and readability while maintaining your authentic voice."
        }
    ];

    const benefits = [
        "Save hours on research and documentation",
        "Work smarter with intelligent analysis",
        "Collaborate seamlessly with your team",
        "Access your work from anywhere"
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src={logo} alt="Dromane" className="h-10 w-10 object-contain" />
                        <span className="text-2xl font-bold text-gray-900">
                            Dromane<span className="text-[#F15025]">.ai</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <button className="px-5 py-2.5 text-gray-700 font-medium hover:text-gray-900 transition-colors">
                                Sign In
                            </button>
                        </Link>
                        <Link to="/register">
                            <button className="px-6 py-2.5 bg-[#F15025] text-white font-semibold hover:bg-[#d43a15] transition-all shadow-sm hover:shadow-md">
                                Get Started
                            </button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="min-h-screen pt-32 pb-20 px-6 relative overflow-hidden bg-white flex items-center">
                {/* Animated mouse-responsive gradient blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Blob 1 - Orange */}
                    <motion.div
                        className="absolute w-[500px] h-[500px] blur-3xl opacity-30"
                        style={{
                            background: 'radial-gradient(circle, #F15025 0%, transparent 70%)',
                            left: `${mousePosition.x * 0.5}%`,
                            top: `${mousePosition.y * 0.3}%`,
                        }}
                        animate={{
                            x: [0, 50, 0],
                            y: [0, 30, 0],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Blob 2 - Light Gray */}
                    <motion.div
                        className="absolute w-[600px] h-[600px] blur-3xl opacity-25"
                        style={{
                            background: 'radial-gradient(circle, #CED0CE 0%, transparent 70%)',
                            right: `${mousePosition.x * 0.3}%`,
                            bottom: `${mousePosition.y * 0.4}%`,
                        }}
                        animate={{
                            x: [0, -40, 0],
                            y: [0, 40, 0],
                        }}
                        transition={{
                            duration: 25,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Blob 3 - Medium Gray */}
                    <motion.div
                        className="absolute w-[450px] h-[450px] blur-3xl opacity-20"
                        style={{
                            background: 'radial-gradient(circle, #E6E8E6 0%, transparent 70%)',
                            left: `${100 - mousePosition.x * 0.4}%`,
                            top: `${100 - mousePosition.y * 0.5}%`,
                        }}
                        animate={{
                            x: [0, 60, 0],
                            y: [0, -50, 0],
                        }}
                        transition={{
                            duration: 22,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Blob 4 - Dark accent */}
                    <motion.div
                        className="absolute w-[400px] h-[400px] blur-3xl opacity-15"
                        style={{
                            background: 'radial-gradient(circle, #191919 0%, transparent 70%)',
                            right: `${mousePosition.x * 0.6}%`,
                            top: `${mousePosition.y * 0.2}%`,
                        }}
                        animate={{
                            x: [0, -30, 0],
                            y: [0, 50, 0],
                        }}
                        transition={{
                            duration: 18,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>

                <div className="max-w-6xl mx-auto text-center relative z-10 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-block mb-6 px-4 py-2 bg-[#F15025]/10 border border-[#F15025]/20 text-[#F15025] font-medium text-sm"
                    >
                        University System Analysis & Design Project
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-6xl md:text-8xl font-bold leading-tight mb-8"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                        <span className="text-gray-900">Your Complete</span>
                        <br />
                        <span className="bg-gradient-to-r from-[#F15025] to-[#ff6b4a] bg-clip-text text-transparent">
                            Research Platform
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed"
                    >
                        Intelligent tools for students, researchers, and professionals to analyze documents, understand code, and conduct research.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
                    >
                        <Link to="/register">
                            <button className="px-10 py-4 bg-[#F15025] text-white font-bold text-lg hover:bg-[#d43a15] transition-all shadow-xl hover:shadow-2xl flex items-center gap-2 group">
                                Start Free Today
                                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                        <Link to="/login">
                            <button className="px-10 py-4 bg-white border-2 border-gray-300 text-gray-900 font-bold text-lg hover:border-gray-400 transition-all">
                                Sign In
                            </button>
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500"
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-green-600" />
                            <span>Free to use</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield size={18} className="text-blue-600" />
                            <span>Secure & private</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap size={18} className="text-purple-600" />
                            <span>Fast & reliable</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-6 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Everything You Need in One Place
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Powerful features designed to streamline your workflow and enhance productivity.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className="bg-white p-8 border border-gray-200 hover:border-[#F15025] hover:shadow-lg transition-all"
                            >
                                <div className="w-12 h-12 bg-[#F15025]/10 flex items-center justify-center text-[#F15025] mb-5">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                Why Choose Dromane?
                            </h2>
                            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                Dromane combines cutting-edge technology with an intuitive interface to help you accomplish more in less time. Our platform is built for anyone who values efficiency and accuracy in their work.
                            </p>
                            <div className="space-y-4">
                                {benefits.map((benefit, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: index * 0.1 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 size={16} className="text-green-600" />
                                        </div>
                                        <span className="text-gray-700 font-medium">{benefit}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-[#F15025]/5 to-purple-50 p-12 border border-gray-200">
                            <div className="space-y-6">
                                <div>
                                    <div className="text-4xl font-bold text-gray-900 mb-2">4</div>
                                    <p className="text-gray-600">Powerful AI tools</p>
                                </div>
                                <div>
                                    <div className="text-4xl font-bold text-gray-900 mb-2">Fast</div>
                                    <p className="text-gray-600">Response times</p>
                                </div>
                                <div>
                                    <div className="text-4xl font-bold text-gray-900 mb-2">Secure</div>
                                    <p className="text-gray-600">Data protection</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-6 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Getting Started is Simple
                        </h2>
                        <p className="text-xl text-gray-600">
                            Start using Dromane in just three easy steps
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: "1",
                                title: "Create Your Account",
                                description: "Sign up for free in seconds. No credit card required to get started."
                            },
                            {
                                step: "2",
                                title: "Choose Your Tool",
                                description: "Select from research, document analysis, code understanding, or content enhancement."
                            },
                            {
                                step: "3",
                                title: "Start Working",
                                description: "Upload documents, ask questions, and get instant, accurate results."
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 bg-[#F15025] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Ready to Transform Your Workflow?
                        </h2>
                        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                            Experience intelligent research and document analysis tools built for students and professionals.
                        </p>
                        <Link to="/register">
                            <button className="px-10 py-4 bg-[#F15025] text-white font-bold text-lg hover:bg-[#d43a15] transition-all shadow-xl hover:shadow-2xl inline-flex items-center gap-2 group">
                                Get Started Free
                                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                        <p className="text-sm text-gray-500 mt-6">
                            No credit card required • Free forever plan available
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-200 py-12 px-6 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <img src={logo} alt="Dromane" className="h-8 w-8 object-contain" />
                            <span className="text-lg font-bold text-gray-900">
                                Dromane<span className="text-[#F15025]">.ai</span>
                            </span>
                        </div>

                        <div className="text-gray-500 text-sm">
                            © 2026 Dromane. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
