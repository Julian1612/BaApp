const SpacedRepetition = {
    // Hole Lern-Status aus localStorage
    getProgress: () => JSON.parse(localStorage.getItem('studyProgress')) || {},
    
    // Speichere Interaktion (z.B. heute gelesen)
    markAsReviewed: (id) => {
        const progress = SpacedRepetition.getProgress();
        progress[id] = { lastReviewed: new Date().toISOString(), count: (progress[id]?.count || 0) + 1 };
        localStorage.setItem('studyProgress', JSON.stringify(progress));
    },

    // Wähle 2 Themen für die Woche aus
    getSuggestions: (allContent) => {
        const progress = SpacedRepetition.getProgress();
        const today = new Date();
        
        // Algorithmus: Priorität für Dinge, die noch NIE oder LANGE NICHT (> 7 Tage) gelernt wurden
        const scoredContent = allContent.map(item => {
            const p = progress[item.id];
            let score = 0;
            
            if (!p) {
                score = 100; // Nie gesehen -> Höchste Prio
            } else {
                const daysSince = (today - new Date(p.lastReviewed)) / (1000 * 60 * 60 * 24);
                if (daysSince > 7) score = 50 + daysSince; // Je länger her, desto höher
                else score = 0; // Kürzlich gelernt -> Ignorieren
            }
            return { ...item, score };
        });

        // Sortiere nach Score und nimm die Top 2
        return scoredContent.sort((a, b) => b.score - a.score).slice(0, 2);
    }
};