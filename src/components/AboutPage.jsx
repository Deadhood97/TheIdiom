import { motion, AnimatePresence } from 'framer-motion';

export default function AboutPage({ isOpen, onClose }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="about-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-50 bg-[#F3F0E6] text-ink overflow-y-auto"
                >
                    <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none fixed"></div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="fixed top-8 right-8 z-50 w-12 h-12 flex items-center justify-center border border-ink/20 rounded-full hover:bg-ink hover:text-paper transition-colors text-2xl"
                    >
                        &times;
                    </button>

                    <div className="max-w-3xl mx-auto py-32 px-8 relative z-10">
                        <header className="text-center mb-24">
                            <div className="text-xs font-bold uppercase tracking-[0.4em] text-ink/40 mb-4">The Manifesto</div>
                            <h1 className="text-6xl md:text-8xl font-serif italic text-ink mb-8">The Idiom</h1>
                            <div className="w-32 h-1 bg-ink mx-auto"></div>
                        </header>

                        <div className="space-y-24 font-serif text-lg md:text-xl leading-relaxed text-ink/80">

                            {/* Section 1: The Mission */}
                            <section>
                                <h2 className="text-3xl font-serif italic mb-6 text-royal">The Universal Truth</h2>
                                <p className="mb-6 first-letter:text-5xl first-letter:font-bold first-letter:mr-2 first-letter:float-left">
                                    Language divides us, but meaning unites us. Across the globe, we all experience the same fundamental human moments: the shame of wasted effort, the joy of unexpected luck, the frustration of hypocrisy.
                                </p>
                                <p>
                                    "The Idiom" is a living archive dedicated to mapping these universal concepts. We look past the literal words to find the shared soul of human expression.
                                </p>
                            </section>

                            {/* Section 2: The Structure */}
                            <section className="bg-white p-12 shadow-sm border border-black/5 rotate-1">
                                <h2 className="text-3xl font-serif italic mb-6 text-saffron">The Structure</h2>
                                <div className="grid md:grid-cols-2 gap-12">
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-widest text-ink/40 mb-2">The Concept</div>
                                        <p>The abstract, universal truth (e.g., "Doing something pointless"). This is the anchor.</p>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-widest text-ink/40 mb-2">The Idiom</div>
                                        <p>The local flavor. Where the English see "Coals to Newcastle," others see "Owls to Athens."</p>
                                    </div>
                                </div>
                            </section>

                            {/* Section 3: User Guide */}
                            <section>
                                <h2 className="text-3xl font-serif italic mb-6">How to Participate</h2>
                                <ul className="space-y-8">
                                    <li className="flex gap-6 items-start">
                                        <div className="bg-saffron text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shrink-0 mt-1">1</div>
                                        <div>
                                            <h3 className="font-bold text-xl mb-2">Vote for Resonance</h3>
                                            <p className="text-ink/60">Click <span className="text-saffron font-bold">RESONATE</span> if an idiom captures a feeling you know well. This measures emotional truth.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-6 items-start">
                                        <div className="bg-royal text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shrink-0 mt-1">2</div>
                                        <div>
                                            <h3 className="font-bold text-xl mb-2">Verify Accuracy</h3>
                                            <p className="text-ink/60">Click <span className="text-royal font-bold">VERIFY</span> if you speak the language and can confirm the usage is correct. This builds our trust score.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-6 items-start">
                                        <div className="bg-ink text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shrink-0 mt-1">3</div>
                                        <div>
                                            <h3 className="font-bold text-xl mb-2">Collect Stamps</h3>
                                            <p className="text-ink/60">Your journey is tracked in your <span className="font-bold">Passport</span>. Visit concepts to collect stamps and build your personal traveler's log.</p>
                                        </div>
                                    </li>
                                </ul>
                            </section>

                            <footer className="text-center pt-24 border-t border-ink/10">
                                <p className="font-serif italic text-2xl mb-4">"To understand the idiom is to understand the people."</p>
                                <button
                                    onClick={onClose}
                                    className="mt-8 px-8 py-3 bg-ink text-paper text-sm font-bold uppercase tracking-widest hover:bg-royal transition-colors"
                                >
                                    Begin Exploring
                                </button>
                            </footer>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
