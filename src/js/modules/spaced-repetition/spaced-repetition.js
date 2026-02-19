const SpacedRepetition = {
    getKey: () => JSON.parse(localStorage.getItem('sr_progress')) || {},
    saveKey: (data) => localStorage.setItem('sr_progress', JSON.stringify(data)),

    getDailyFocus: (content) => {
        const today = new Date().toDateString();
        const stored = JSON.parse(localStorage.getItem('sr_daily_focus'));
        if (stored && stored.date === today) return content.find(c => c.id === stored.id);

        const db = SpacedRepetition.getKey();
        const now = new Date();
        
        let candidates = content.filter(c => {
            if (!db[c.id]) return true; 
            return new Date(db[c.id].nextReview) <= now;
        });

        if (candidates.length === 0) candidates = content;
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        
        if (pick) localStorage.setItem('sr_daily_focus', JSON.stringify({ date: today, id: pick.id }));
        return pick;
    },

    getWeeklyPlan: (content) => {
        const now = new Date();
        const onejan = new Date(now.getFullYear(), 0, 1);
        const week = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
        const key = `sr_weekly_plan_${now.getFullYear()}_${week}`;

        const stored = JSON.parse(localStorage.getItem(key));
        if (stored) {
            return { itm: content.find(c => c.id === stored.itmId), org: content.find(c => c.id === stored.orgId) };
        }

        const itm = content.filter(c => c.subjectKey === 'itm_grundlagen');
        const org = content.filter(c => c.subjectKey === 'organisation_projekte');

        const plan = {
            itmId: itm[Math.floor(Math.random() * itm.length)]?.id,
            orgId: org[Math.floor(Math.random() * org.length)]?.id
        };

        localStorage.setItem(key, JSON.stringify(plan));
        return { itm: content.find(c => c.id === plan.itmId), org: content.find(c => c.id === plan.orgId) };
    },

    // SM-2 Algorithm
    processResult: (id, quality) => {
        const db = SpacedRepetition.getKey();
        // Default: Interval 0, Reps 0, Easiness Factor 2.5
        let item = db[id] || { interval: 0, reps: 0, ef: 2.5 };

        // Quality: 0-2 (Fail), 3 (Hard), 4 (Good), 5 (Easy)
        if (quality >= 3) {
            if (item.reps === 0) {
                item.interval = 1;
            } else if (item.reps === 1) {
                item.interval = 6;
            } else {
                item.interval = Math.round(item.interval * item.ef);
            }
            
            item.reps++;
            // Update EF based on performance
            item.ef = item.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            if (item.ef < 1.3) item.ef = 1.3;
        } else {
            // Reset on fail
            item.reps = 0;
            item.interval = 1;
        }

        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + item.interval);
        
        db[id] = { ...item, nextReview: nextDate.toISOString() };
        SpacedRepetition.saveKey(db);
        
        return item.interval;
    },

    // Backward compatibility alias
    markAsReviewed: (id) => SpacedRepetition.processResult(id, 4)
};
window.SpacedRepetition = SpacedRepetition;