export default function ConceptCard({ concept, onClick }) {
    return (
        <div
            onClick={onClick}
            className="bg-white p-8 border-2 border-black/5 hover:border-black/10 cursor-pointer transition-all duration-300 group relative overflow-hidden shadow-sm hover:shadow-md aspect-[3/4]"
        >
            <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none"></div>

            {/* Decorative inner border for 'Archive Card' look */}
            <div className="absolute inset-3 border border-black/5 pointer-events-none transition-all duration-500 group-hover:border-saffron/30"></div>

            <div className="h-full flex flex-col justify-between items-center relative z-10 py-4">
                <div className="mb-6 transform group-hover:scale-110 transition-transform duration-500 ease-out text-center pt-8 flex justify-center">
                    {concept.image ? (
                        <div className="relative w-32 h-32">
                            <img
                                src={concept.image}
                                alt={concept.universal_concept}
                                className="w-full h-full object-cover rounded-full border-4 border-white shadow-md grayscale group-hover:grayscale-0 transition-all duration-500"
                            />
                            <div className="absolute inset-0 rounded-full border border-black/10 pointer-events-none"></div>
                        </div>
                    ) : (
                        <span className="text-7xl filter drop-shadow-sm grayscale group-hover:grayscale-0 transition-all duration-500">{concept.emoji}</span>
                    )}
                </div>

                <div className="text-center w-full px-4">
                    <h3 className="font-serif text-3xl mb-3 text-ink group-hover:text-royal transition-colors letterpress leading-tight">
                        {concept.universal_concept}
                    </h3>
                    <div className="w-8 h-1 bg-saffron/40 mx-auto group-hover:w-16 transition-all duration-300 rounded-full"></div>
                </div>

                <div className="text-center opacity-60 group-hover:opacity-100 transition-opacity duration-300 pb-4">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40">
                        {concept.idioms.length} entries
                    </span>
                </div>
            </div>
        </div>
    );
}
