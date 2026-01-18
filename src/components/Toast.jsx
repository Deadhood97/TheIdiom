import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

/**
 * A lightweight, transient notification component.
 * @param {string} message - The text to display
 * @param {'success' | 'error' | 'info'} type - The stylistic theme
 * @param {function} onClose - Callback to remove the toast
 */
export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [message, onClose, duration]);

    if (!message) return null;

    const bgClass = {
        success: 'bg-emerald-600',
        error: 'bg-rose-600',
        info: 'bg-royal'
    }[type];

    const icon = {
        success: '✅',
        error: '⚠️',
        info: 'ℹ️'
    }[type];

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 text-white font-bold text-sm tracking-wide ${bgClass}`}
        >
            <span className="text-lg">{icon}</span>
            <span>{message}</span>
            <button
                onClick={onClose}
                className="ml-4 opacity-50 hover:opacity-100 transition-opacity"
            >
                ✕
            </button>
        </motion.div>
    );
}
