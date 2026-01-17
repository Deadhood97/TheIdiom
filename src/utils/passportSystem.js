export const getVisitedConcepts = () => {
    try {
        const stored = localStorage.getItem('idiom_passport');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

export const addVisitedConcept = (concept) => {
    try {
        const visited = getVisitedConcepts();
        if (!visited.some(c => c.id === concept.id)) {
            const newEntry = {
                id: concept.id,
                universal_concept: concept.universal_concept,
                emoji: concept.emoji,
                image: concept.image,
                timestamp: new Date().toISOString()
            };
            const updated = [newEntry, ...visited];
            localStorage.setItem('idiom_passport', JSON.stringify(updated));
            return updated;
        }
        return visited;
    } catch (e) {
        return [];
    }
};

export const clearPassport = () => {
    localStorage.removeItem('idiom_passport');
    return [];
};
