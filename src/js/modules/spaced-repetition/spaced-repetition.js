const SpacedRepetition = {
    getKey: () => JSON.parse(localStorage.getItem('sr_progress')) || {},
    saveKey: (data) => localStorage.setItem('sr_progress', JSON.stringify(data)),
    
    _getWeekNumber: () => {
        const d = new Date();
        d.setHours(0,0,0,0);
        d.setDate(d.getDate() + 4 - (d.getDay()||7));
        return Math.ceil((((d - new Date(d.getFullYear(),0,1))/86400000)+1)/7);
    },

    getRankedSuggestions: (content) => {
        const db = SpacedRepetition.getKey();
        const now = new Date();
        const suggestions = content.map(item => {
            const record = db[item.id];
            if (!record) {
                return { ...item, overdueDays: 999 - Math.random() * 10 };
            }
            const nextReview = new Date(record.nextReview);
            if (nextReview <= now) {
                const overdueDays = (now - nextReview) / (1000 * 60 * 60 * 24);
                return { ...item, overdueDays: overdueDays };
            }
            return null;
        }).filter(item => item !== null);
        return suggestions.sort((a, b) => b.overdueDays - a.overdueDays);
    },

    getDailyPicks: (rankedSuggestions) => {
        const picks = { script: null, audio: null, flashcards: null };
        const pickedIds = new Set();
        
        for (const item of rankedSuggestions) {
            if (!picks.script && item.files.script && !pickedIds.has(item.id)) {
                picks.script = item;
                pickedIds.add(item.id);
            }
            if (!picks.audio && item.files.audio && !pickedIds.has(item.id)) {
                picks.audio = item;
                pickedIds.add(item.id);
            }
            // Simple heuristic for now: any item can be a flashcard pick if not already chosen
            if (!picks.flashcards && !pickedIds.has(item.id)) {
                picks.flashcards = item;
                pickedIds.add(item.id);
            }
            if (picks.script && picks.audio && picks.flashcards) break;
        }
        return picks;
    },
    
    getWeeklyPlan: (content, rankedSuggestions) => {
        const now = new Date();
        const key = `sr_weekly_plan_${now.getFullYear()}_${SpacedRepetition._getWeekNumber()}`;
        const stored = JSON.parse(localStorage.getItem(key));
        if (stored) {
            return {
                itm: content.find(c => c.id === stored.itmId),
                org: content.find(c => c.id === stored.orgId)
            };
        }

        const itmSuggestions = rankedSuggestions.filter(c => c.subjectKey === 'itm_grundlagen');
        const orgSuggestions = rankedSuggestions.filter(c => c.subjectKey === 'organisation_projekte');
        
        let itmPick = itmSuggestions.length > 0 ? itmSuggestions[0] : content.find(c => c.subjectKey === 'itm_grundlagen');
        let orgPick = orgSuggestions.length > 0 ? orgSuggestions[0] : content.find(c => c.subjectKey === 'organisation_projekte' && c.id !== itmPick?.id);

        // Fallback if the first ORG pick was the same as ITM
        if (!orgPick) {
             orgPick = content.find(c => c.subjectKey === 'organisation_projekte');
        }
        
        const plan = { itmId: itmPick?.id, orgId: orgPick?.id };
        localStorage.setItem(key, JSON.stringify(plan));
        return { itm: itmPick, org: orgPick };
    },

    processResult: (id, quality) => { /* ... */ },
    markAsReviewed: (id) => SpacedRepetition.processResult(id, 4)
};
window.SpacedRepetition = SpacedRepetition;