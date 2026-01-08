import { useState } from 'react';
import { uploadDocument } from '../lib/api';

export default function Upload({ onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError('');

        try {
            await uploadDocument(file);
            setFile(null);
            if (onUploadSuccess) onUploadSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl shadow-lg transition-colors">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white transition-colors">Upload PDF</h2>
            {error && (
                <div className="p-3 mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/20 transition-colors">
                    {error}
                </div>
            )}
            <form onSubmit={handleUpload} className="flex flex-col gap-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500 dark:text-slate-400 transition-colors"><span className="font-semibold text-gray-700 dark:text-slate-300">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 transition-colors">PDF (MAX. 10MB)</p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                </label>

                {file && (
                    <div className="text-sm text-gray-700 dark:text-slate-300 transition-colors">
                        Selected: <span className="font-medium text-gray-900 dark:text-white">{file.name}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!file || loading}
                    className={`w-full py-2.5 px-4 rounded-xl text-white font-bold transition-all shadow-lg ${!file || loading
                        ? 'bg-gray-400 dark:bg-slate-700 cursor-not-allowed opacity-50'
                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                        }`}
                >
                    {loading ? 'Processing...' : 'Upload document'}
                </button>
            </form>
        </div>
    );
}
