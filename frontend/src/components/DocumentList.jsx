import { FileText, Trash2, Calendar, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DocumentList({ documents = [], currentDoc, onSelectDoc, onDeleteDoc }) {
    if (!documents || documents.length === 0) {
        return (
            <div className="p-6 text-center">
                <FileText className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-slate-400">
                    No documents uploaded yet
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                    Upload a PDF to get started
                </p>
            </div>
        );
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="space-y-2 p-4">
            <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-3 px-2">
                Your Documents
            </h3>
            <AnimatePresence>
                {documents.map((doc, index) => {
                    const isActive = currentDoc?.filename === doc.filename;
                    return (
                        <motion.div
                            key={doc.filename || index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className={`
                                group relative p-3 rounded-xl cursor-pointer transition-all border
                                ${isActive
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30'
                                    : 'bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }
                            `}
                            onClick={() => onSelectDoc && onSelectDoc(doc)}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`
                                    flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                                    ${isActive
                                        ? 'bg-indigo-100 dark:bg-indigo-500/20'
                                        : 'bg-gray-100 dark:bg-slate-700'
                                    }
                                `}>
                                    <FileCode className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-slate-400'}`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={`
                                        text-sm font-semibold truncate
                                        ${isActive
                                            ? 'text-indigo-900 dark:text-indigo-300'
                                            : 'text-gray-900 dark:text-white'
                                        }
                                    `}>
                                        {doc.filename}
                                    </p>

                                    <div className="flex items-center gap-3 mt-1">
                                        {doc.uploadDate && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                                                <span className="text-xs text-gray-500 dark:text-slate-400">
                                                    {formatDate(doc.uploadDate)}
                                                </span>
                                            </div>
                                        )}
                                        {doc.size && (
                                            <span className="text-xs text-gray-500 dark:text-slate-400">
                                                {formatSize(doc.size)}
                                            </span>
                                        )}
                                        {doc.chunks && (
                                            <span className="text-xs text-gray-500 dark:text-slate-400">
                                                {doc.chunks} chunks
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {onDeleteDoc && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteDoc(doc);
                                        }}
                                        className="
                                            opacity-0 group-hover:opacity-100 transition-opacity
                                            p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/10
                                            text-gray-400 hover:text-red-600 dark:hover:text-red-400
                                        "
                                        title="Delete document"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {isActive && (
                                <motion.div
                                    layoutId="activeIndicator"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 dark:bg-indigo-400 rounded-r-full"
                                />
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
