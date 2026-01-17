import { useState } from 'react';

import { API_BASE_URL } from '../config';

export default function IdiomItem({ idiom, conceptId, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasVoted, setHasVoted] = useState({ resonance: false, accuracy: false });

    const [voteCounts, setVoteCounts] = useState(idiom.voting || { resonance: 0, accuracy: 0 });

    const handleVote = async (type) => {
        if (hasVoted[type]) return;
        setHasVoted(prev => ({ ...prev, [type]: true }));

        try {
            const res = await fetch(`${API_BASE_URL}/api/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conceptId, idiomScript: idiom.script, type })
            });
            const data = await res.json();
            if (data.success) {
                setVoteCounts(data.newCounts);
            }
        } catch (e) {
            console.error("Vote failed", e);
        }
    };

    const handleRevise = async () => {
        if (!feedback.trim()) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/revise`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conceptId, idiomScript: idiom.script, userFeedback: feedback })
            });
            const data = await res.json();
            if (data.success) {
                onUpdate(data.updatedIdiom);
                setIsEditing(false);
                setFeedback('');
            } else {
                alert("Failed to revise: " + (data.error || "Unknown error"));
            }
        } catch (e) {
            console.error("Revision error", e);
            alert('Revision failed due to network error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 shadow-sm border border-black/5 hover:border-saffron/50 transition-colors group flex flex-col h-full">
            {/* Header: Script & Language */}
            <div className="flex justify-between items-start mb-4">
                <div className="font-noto text-2xl mb-1">{idiom.script}</div>
                {idiom.transliteration && (
                    <div className="font-serif italic text-ink/50 text-sm mb-2">
                        ({idiom.transliteration})
                    </div>
                )}
                <div className="flex flex-col items-end">
                    <div className="text-sm font-bold uppercase tracking-widest text-ink/40 mb-2">{idiom.language}</div>
                    <button
                        onClick={() => {
                            if (idiom.audio_url) {
                                // Clean up double slashes if BASE_URL ends with / and audio_url starts with /
                                const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
                                const audioPath = `${baseUrl}${idiom.audio_url}`;
                                const audio = new Audio(audioPath);
                                audio.play().catch(e => console.error("Audio play failed:", e));
                                return;
                            }

                            const synth = window.speechSynthesis;
                            const voices = synth.getVoices();

                            const langMap = {
                                'Hindi': 'hi-IN',
                                'Japanese': 'ja-JP',
                                'Spanish': 'es-ES',
                                'French': 'fr-FR',
                                'German': 'de-DE',
                                'Italian': 'it-IT',
                                'Portuguese': 'pt-PT',
                                'Russian': 'ru-RU',
                                'Chinese': 'zh-CN',
                                'Swahili': 'sw-TZ',
                                'Tamil': 'ta-IN',
                                'Telugu': 'te-IN',
                                'Bengali': 'bn-IN',
                                'Persian': 'fa-IR',
                                'Turkish': 'tr-TR',
                                'Vietnamese': 'vi-VN',
                                'Estonian': 'et-EE',
                                'Latin': 'it-IT',
                                'English': 'en-GB'
                            };

                            const targetLangCode = langMap[idiom.language];
                            const nativeVoice = voices.find(v => v.lang.includes(targetLangCode));

                            let textToSpeak = idiom.script;
                            let langToUse = targetLangCode || 'en-US';

                            if (!nativeVoice && targetLangCode !== 'en-GB') {
                                if (idiom.pronunciation_easy) {
                                    textToSpeak = idiom.pronunciation_easy;
                                    langToUse = 'en-US';
                                }
                            }

                            const utterance = new SpeechSynthesisUtterance(textToSpeak);
                            utterance.lang = langToUse;
                            if (nativeVoice) utterance.voice = nativeVoice;

                            synth.cancel();
                            synth.speak(utterance);
                        }}
                        className="text-xs flex items-center gap-1 text-royal/60 hover:text-royal transition-colors font-bold uppercase tracking-wider"
                        title={idiom.audio_url ? "Play High-Fidelity Audio" : "Play Native Pronunciation"}
                    >
                        <span>🔊 Play Audio</span>
                    </button>
                </div>
            </div>

            {/* Primary Translation */}
            <div className="font-serif text-xl italic text-ink/80 mb-4">
                "{idiom.literal_translation}"
            </div>

            {/* Origin & Context */}
            <div className="mb-6">
                <div className="text-sm font-bold uppercase tracking-widest text-ink/40 mb-2">Origin</div>
                <p className="font-serif italic text-ink/80 text-lg leading-relaxed">
                    {idiom.origin_story}
                </p>
            </div>

            {idiom.usage_example && (
                <div className="mb-6 relative pl-6 border-l-2 border-saffron/30">
                    <p className="font-serif text-ink mb-1">“{idiom.usage_example.native}”</p>
                    <p className="font-sans text-xs text-ink/50 uppercase tracking-widest">{idiom.usage_example.translation}</p>
                </div>
            )}

            {idiom.literature_reference && (
                <div className="mb-6 bg-paper-dark/30 p-4 rounded-sm border border-black/5 flex gap-3 text-sm">
                    <span className="text-xl">📖</span>
                    <div>
                        <div className="font-bold text-ink/80">{idiom.literature_reference.source}</div>
                        <div className="text-ink/60 italic">{idiom.literature_reference.context}</div>
                    </div>
                </div>
            )}

            {/* Interactive Footer */}
            <div className="border-t border-black/5 pt-4 mt-auto flex items-center justify-between gap-4">
                <div className="flex gap-4">
                    <button
                        onClick={() => handleVote('resonance')}
                        disabled={hasVoted.resonance}
                        className={`group/btn flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors border ${hasVoted.resonance
                            ? 'bg-saffron text-white border-saffron'
                            : 'bg-transparent text-ink/60 border-black/10 hover:border-saffron hover:text-saffron'
                            }`}
                    >
                        <span>{hasVoted.resonance ? 'Resonated' : 'Resonate'}</span>
                        <span className={`bg-black/5 px-1.5 py-0.5 rounded text-[10px] ${hasVoted.resonance ? 'text-saffron bg-white' : 'text-ink/40 group-hover/btn:text-saffron'}`}>
                            {voteCounts.resonance}
                        </span>
                    </button>

                    <button
                        onClick={() => handleVote('accuracy')}
                        disabled={hasVoted.accuracy}
                        className={`group/btn flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors border ${hasVoted.accuracy
                            ? 'bg-royal text-white border-royal'
                            : 'bg-transparent text-ink/60 border-black/10 hover:border-royal hover:text-royal'
                            }`}
                    >
                        <span>{hasVoted.accuracy ? 'Verified' : 'Verify'}</span>
                        <span className={`bg-black/5 px-1.5 py-0.5 rounded text-[10px] ${hasVoted.accuracy ? 'text-royal bg-white' : 'text-ink/40 group-hover/btn:text-royal'}`}>
                            {voteCounts.accuracy}
                        </span>
                    </button>
                </div>

                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs underline text-ink/40 hover:text-ink transition-colors"
                >
                    {isEditing ? 'Cancel' : 'Suggest Nuance'}
                </button>
            </div>

            {/* Edit Form */}
            {isEditing && (
                <div className="mt-4 animate-fadeIn">
                    <textarea
                        className="w-full bg-paper p-3 text-sm border border-black/10 focus:border-royal outline-none resize-none font-sans"
                        rows="3"
                        placeholder="Add context, correct translation, or explain usage..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                    />
                    <button
                        onClick={handleRevise}
                        disabled={isLoading || !feedback.trim()}
                        className="mt-2 w-full bg-ink text-paper py-2 text-sm font-bold uppercase tracking-wider hover:bg-royal disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? 'Consulting Linguist AI...' : 'Submit Revision'}
                    </button>
                </div>
            )}
        </div>
    );
}
