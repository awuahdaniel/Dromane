import { motion } from 'framer-motion';

export function Skeleton({ className }) {
    return (
        <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className={`bg-slate-800 rounded-xl ${className}`}
        />
    );
}

export function DashboardSkeleton() {
    return (
        <div className="p-8 space-y-12 h-screen overflow-hidden">
            <div className="space-y-4">
                <Skeleton className="h-6 w-32 rounded-full" />
                <Skeleton className="h-12 w-2/3 md:w-1/2" />
                <Skeleton className="h-6 w-full max-w-2xl" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-64 rounded-3xl" />
                <Skeleton className="h-64 rounded-3xl" />
                <Skeleton className="h-64 rounded-3xl" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-32 rounded-3xl" />
                <Skeleton className="h-32 rounded-3xl" />
            </div>
        </div>
    );
}

export function ChatSkeleton() {
    return (
        <div className="flex-1 flex flex-col h-screen bg-slate-950 p-8 space-y-8 overflow-hidden">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
            </div>

            <div className="flex-1 space-y-8">
                <div className="flex gap-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-20 w-1/2 rounded-2xl" />
                </div>
                <div className="flex gap-4 flex-row-reverse">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-32 w-2/3 rounded-2xl" />
                </div>
                <div className="flex gap-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-24 w-1/3 rounded-2xl" />
                </div>
            </div>

            <Skeleton className="h-16 w-full max-w-4xl mx-auto rounded-2xl mb-8" />
        </div>
    );
}
