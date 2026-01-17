import { motion, AnimatePresence } from 'framer-motion';

export default function Passport({ isOpen, onClose, visited }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed right-0 top-0 h-full w-full max-w-sm bg-paper shadow-2xl z-50 p-8 flex flex-col border-l border-ink/10"
                    >
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-ink/10">
                            <div>
                                <h2 className="font-serif text-3xl italic text-ink">My Passport</h2>
                                <p className="text-xs font-bold uppercase tracking-widest text-ink/40 mt-1">
                                    {visited.length} Stamps Collected
                                </p>
                            </div>
                            <button onClick={onClose} className="text-2xl hover:text-royal transition-colors">&times;</button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                            {visited.length === 0 ? (
                                <div className="text-center mt-20 opacity-40">
                                    <div className="text-6xl mb-4">🛂</div>
                                    <p className="font-serif italic">Your passport is empty.</p>
                                    <p className="text-xs uppercase tracking-widest mt-2">Explore concepts to collect stamps</p>
                                </div>
                            ) : (
                                visited.map((stamp, idx) => (
                                    <div key={idx} className="flex gap-4 items-center bg-white p-4 rounded-sm shadow-sm border border-black/5">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-black/10 shrink-0">
                                            {stamp.image ? (
                                                <img src={stamp.image} className="w-full h-full object-cover grayscale" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-paper-dark text-xl">{stamp.emoji}</div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-serif text-lg leading-tight text-ink/80">{stamp.universal_concept}</h3>
                                            <p className="text-[10px] uppercase tracking-widest text-ink/30 mt-1">
                                                {new Date(stamp.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
