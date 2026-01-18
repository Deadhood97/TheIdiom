import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config';
import Loader from './Loader';
import Toast from './Toast';

const LANGUAGES = [
    "Korean", "Thai", "Polish", "Ukrainian", "Greek", "Hebrew", "Indonesian",
    "Malay", "Tagalog", "Hungarian", "Czech", "Romanian", "Dutch", "Swedish",
    "Norwegian", "Finnish", "Danish", "Icelandic", "Welsh", "Irish",
    "Scottish Gaelic", "Amharic", "Yoruba", "Zulu", "Xhosa", "Hausa",
    "Somali", "Farsi", "Pashto", "Urdu", "Nepali", "Sinhala", "Burmese",
    "Khmer", "Lao", "Mongolian", "Georgian", "Armenian", "Kazakh",
    "Punjabi", "Telugu", "Tamil", "Bengali", "Marathi", "Gujarati", "Kannada", "Latin"
];

export default function AddLanguageControl({ conceptId, conceptTitle, onSuccess }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const handleGenerate = async () => {
        if (!selectedLanguage) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/generate-idiom`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conceptId,
                    conceptTitle,
                    targetLanguage: selectedLanguage
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to generate idiom");
            }

            setToast({ message: `Successfully archived the ${selectedLanguage} idiom!`, type: 'success' });

            // Wait a moment for user to see success before closing
            setTimeout(() => {
                onSuccess(data.idiom);
                setIsOpen(false);
                setSelectedLanguage('');
            }, 1500);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-paper/50 rounded-lg border border-black/5">
                <Loader />
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-ink/60 animate-pulse">
                    Consulting the Archives for {selectedLanguage}...
                </p>
            </div>
        );
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full py-4 border-2 border-dashed border-black/10 text-ink/40 hover:text-royal hover:border-royal/40 font-bold uppercase tracking-widest text-xs transition-all rounded-lg flex items-center justify-center gap-2 group"
            >
                <span>+ Add Language</span>
                <span className="opacity-50 group-hover:opacity-100 transition-opacity">🌍</span>
            </button>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white border border-black/10 rounded-lg shadow-sm"
        >
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-serif italic text-xl text-ink">Expand the Archive</h4>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-ink/40 hover:text-red-500 transition-colors"
                >
                    ✕
                </button>
            </div>

            <p className="text-sm text-ink/60 mb-4 font-serif">
                Search specifically for an idiom in {conceptTitle} from:
            </p>

            <div className="flex gap-2 mb-4">
                <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="flex-1 p-2 border-b-2 border-ink/10 focus:border-royal outline-none bg-transparent font-sans"
                >
                    <option value="">Select a language...</option>
                    {LANGUAGES.sort().map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>

                <button
                    onClick={handleGenerate}
                    disabled={!selectedLanguage}
                    className="px-6 py-2 bg-royal text-white font-bold uppercase tracking-wider text-xs rounded hover:bg-royal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Generate
                </button>
            </div>

            {error && (
                <div className="text-red-500 text-xs italic bg-red-50 p-3 rounded">
                    Error: {error}
                </div>
            )}

            <p className="text-[10px] text-ink/30 uppercase tracking-widest text-center mt-2">
                Powered by AI • Verified for Authenticity
            </p>

            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
