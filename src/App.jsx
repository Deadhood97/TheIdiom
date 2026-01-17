import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import IdiomItem from './components/IdiomItem';
import ConceptCard from './components/ConceptCard';
import WorldMap from './components/WorldMap';
import AboutPage from './components/AboutPage';
import Passport from './components/Passport';
import { getVisitedConcepts, addVisitedConcept } from './utils/passportSystem';

function App() {
  const [data, setData] = useState(null);
  const [selectedConceptId, setSelectedConceptId] = useState(null);
  const [showMap, setShowMap] = useState(true);

  // Passport State
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [visitedConcepts, setVisitedConcepts] = useState([]);

  // About Page State
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  useEffect(() => {
    // Load initial data
    fetch('http://localhost:3001/api/data')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);

    // Load passport
    setVisitedConcepts(getVisitedConcepts());
  }, []);

  // Handle Stamp Collection
  useEffect(() => {
    if (selectedConceptId && data) {
      const concept = data.concepts.find(c => c.id === selectedConceptId);
      if (concept) {
        const updated = addVisitedConcept(concept);
        setVisitedConcepts(updated);
      }
    }
  }, [selectedConceptId, data]);

  const handleRandomJump = () => {
    if (!data) return;
    const randomIdx = Math.floor(Math.random() * data.concepts.length);
    setSelectedConceptId(data.concepts[randomIdx].id);
  };

  const handleIdiomUpdate = (updatedIdiom, conceptId) => {
    setData(prevData => {
      const newConcepts = prevData.concepts.map(concept => {
        if (concept.id !== conceptId) return concept;
        const newIdioms = concept.idioms.map(idiom =>
          idiom.script === updatedIdiom.script ? updatedIdiom : idiom
        );
        return { ...concept, idioms: newIdioms };
      });
      return { ...prevData, concepts: newConcepts };
    });
  };

  const activeConcept = data?.concepts.find(c => c.id === selectedConceptId);

  return (
    <div className="min-h-screen bg-paper text-ink p-8 md:p-12 transition-colors duration-700 font-sans">
      <AboutPage isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      <Passport
        isOpen={isPassportOpen}
        onClose={() => setIsPassportOpen(false)}
        visited={visitedConcepts}
      />

      <header className="max-w-6xl mx-auto mb-16 border-b border-ink/10 pb-8 relative flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h1
            className="text-5xl md:text-6xl font-serif italic mb-2 text-ink cursor-pointer hover:text-royal transition-colors"
            onClick={() => setSelectedConceptId(null)}
          >
            The Idiom
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/60 font-bold">Global Cultural Archive</p>
        </div>

        <div className="flex gap-4 items-center">
          <button
            onClick={handleRandomJump}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white border border-black/10 hover:border-royal hover:text-royal transition-all shadow-sm"
          >
            🎲 Random Jump
          </button>
          <button
            onClick={() => setIsPassportOpen(true)}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-ink text-paper hover:bg-royal transition-all shadow-md flex items-center gap-2"
          >
            <span>Passport</span>
            <span className="bg-white/20 px-1.5 rounded text-[10px]">{visitedConcepts.length}</span>
          </button>
          <button
            onClick={() => setIsAboutOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-black/10 text-ink/40 hover:text-royal hover:border-royal transition-colors font-serif italic font-bold"
            title="About The Idiom"
          >
            i
          </button>
        </div>

        {selectedConceptId && (
          <button
            onClick={() => setSelectedConceptId(null)}
            className="absolute left-0 -bottom-16 md:bottom-auto md:top-1/2 md:-translate-y-1/2 text-sm font-bold uppercase tracking-widest text-ink/40 hover:text-royal transition-colors flex items-center gap-2 hidden md:flex"
          >
            &larr; Back
          </button>
        )}
      </header>

      <main className="max-w-6xl mx-auto min-h-screen">
        {!data ? (
          <div className="text-center font-serif text-xl animate-pulse text-ink/40 mt-32">Loading Archive...</div>
        ) : (
          <AnimatePresence mode="wait">
            {/* View 1: Concept Deck */}
            {!selectedConceptId ? (
              <motion.div
                key="deck"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {data.concepts.map((concept) => (
                  <ConceptCard
                    key={concept.id}
                    concept={concept}
                    onClick={() => setSelectedConceptId(concept.id)}
                  />
                ))}
              </motion.div>
            ) : (
              /* View 2: Concept Detail */
              activeConcept && (
                <motion.div
                  key={activeConcept.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }} // Zoom out slightly on exit logic
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="relative min-h-screen"
                >

                  {/* Immersive Map Hero */}
                  <div className="absolute top-0 left-0 w-full h-[50vh] z-0 opacity-40 pointer-events-none grayscale-[30%] mix-blend-multiply">
                    {activeConcept.idioms.some(i => i.geolocation) && (
                      <WorldMap idioms={activeConcept.idioms} activeConcept={activeConcept} heroMode={true} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F3F0E6]/50 to-[#F3F0E6]"></div>
                  </div>

                  <div className="relative z-10 pt-32">
                    <div className="text-center mb-16 px-4">
                      {activeConcept.image ? (
                        <div className="w-48 h-48 mx-auto mb-8 relative">
                          <motion.img
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            src={activeConcept.image}
                            alt={activeConcept.universal_concept}
                            className="w-full h-full object-cover rounded-full border-4 border-white/80 shadow-2xl"
                          />
                          <div className="absolute inset-0 rounded-full border border-black/10"></div>
                        </div>
                      ) : (
                        <span className="text-8xl mb-6 block animate-bounce-slow drop-shadow-xl">{activeConcept.emoji}</span>
                      )}

                      <h2 className="text-5xl md:text-7xl font-serif text-royal mb-4 drop-shadow-sm">{activeConcept.universal_concept}</h2>
                      <div className="w-24 h-1 bg-saffron mx-auto shadow-sm"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                      {activeConcept.idioms.map((idiom, idx) => (
                        <IdiomItem
                          key={idx}
                          idiom={idiom}
                          conceptId={activeConcept.id}
                          onUpdate={(updated) => handleIdiomUpdate(updated, activeConcept.id)}
                        />
                      ))}
                    </div>

                    {/* Return Navigation Footer */}
                    <div className="mt-24 text-center">
                      <button
                        onClick={() => setSelectedConceptId(null)}
                        className="px-8 py-3 bg-ink text-paper font-serif italic text-xl hover:bg-royal transition-colors shadow-lg"
                      >
                        Return to Archive
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

export default App;
