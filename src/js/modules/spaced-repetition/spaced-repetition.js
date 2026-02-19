const SpacedRepetition = {
    getKey: () => JSON.parse(localStorage.getItem('sr_progress')) || {},
    saveKey: (data) => localStorage.setItem('sr_progress', JSON.stringify(data)),

    // Algorithm: Determines the next due date based on previous performance
    markAsReviewed: (id) => {
        const db = SpacedRepetition.getKey();
        const item = db[id] || { interval: 0, reps: 0 };
        
        // Super simple SM-2 like progression: 1 -> 3 -> 7 -> 14 -> 30 days
        const nextInterval = item.interval === 0 ? 1 : Math.ceil(item.interval * 2.2);
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + nextInterval);

        db[id] = { 
            nextReview: nextDate.toISOString(), 
            interval: nextInterval, 
            reps: item.reps + 1 
        };
        SpacedRepetition.saveKey(db);
    },

    getDailyFocus: (content) => {
        const today = new Date().toDateString();
        // Check if we already picked a focus for today
        const stored = JSON.parse(localStorage.getItem('sr_daily_focus'));
        if (stored && stored.date === today) return content.find(c => c.id === stored.id);

        // Find most overdue item
        const db = SpacedRepetition.getKey();
        const now = new Date();
        
        let candidates = content.filter(c => {
            if (!db[c.id]) return true; // New items are high priority
            return new Date(db[c.id].nextReview) <= now;
        });

        // If nothing is overdue, pick random
        if (candidates.length === 0) candidates = content;
        
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        
        if (pick) localStorage.setItem('sr_daily_focus', JSON.stringify({ date: today, id: pick.id }));
        return pick;
    },

    getWeeklyPlan: (content) => {
        // Calculate current Week Number to rotate plan weekly
        const now = new Date();
        const onejan = new Date(now.getFullYear(), 0, 1);
        const week = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
        const key = `sr_weekly_plan_${now.getFullYear()}_${week}`;

        const stored = JSON.parse(localStorage.getItem(key));
        if (stored) {
            return {
                itm: content.find(c => c.id === stored.itmId),
                org: content.find(c => c.id === stored.orgId)
            };
        }

        // Generate new plan
        const itm = content.filter(c => c.subjectKey === 'itm_grundlagen');
        const org = content.filter(c => c.subjectKey === 'organisation_projekte');

        const plan = {
            itmId: itm[Math.floor(Math.random() * itm.length)]?.id,
            orgId: org[Math.floor(Math.random() * org.length)]?.id
        };

        localStorage.setItem(key, JSON.stringify(plan));
        return { 
            itm: content.find(c => c.id === plan.itmId), 
            org: content.find(c => c.id === plan.orgId) 
        };
    }
};
window.SpacedRepetition = SpacedRepetition;