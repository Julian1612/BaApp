Object.assign(UI, {
    renderDashboard: async (content) => {
        const container = document.getElementById('view-dashboard');
        if (!container) return; 

        const suggestions = SpacedRepetition.getSuggestions(content);
        let nuggetHtml = '';
        try {
            const nugget = await UI.getDailyNugget(content);
            if(nugget) {
                nuggetHtml = `
                <div class="mb-6 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-5 rounded-3xl shadow-lg relative overflow-hidden">
                     <div class="relative z-10">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">Wissen des Tages</span>
                        <p class="mt-2 text-gray-200 text-lg font-medium italic">"${nugget.text}"</p>
                        <button onclick="app.reader.open('${nugget.sourceUrl}', '${nugget.sourceTitle}', '${nugget.sourceId}')" class="mt-4 text-sm text-blue-400 font-medium flex items-center gap-1">
                            Zum Skript <i class="fas fa-arrow-right text-xs"></i>
                        </button>
                     </div>
                </div>`;
            }
        } catch(e) { console.error(e); }

        let html = `${nuggetHtml}<h3 class="font-bold text-gray-300 mb-3 px-1 text-sm uppercase tracking-wider">Fokus der Woche</h3><div class="space-y-4">`;
        suggestions.forEach(item => html += UI.createCard(item, true));
        if (suggestions.length === 0) html += `<div class="bg-gray-800 p-8 rounded-3xl text-center border border-gray-700"><p class="font-medium text-white">Alles erledigt!</p></div>`;
        html += '</div>';
        container.innerHTML = html;
    },

    getDailyNugget: async (content) => {
        const today = new Date().toDateString();
        const stored = JSON.parse(localStorage.getItem('dailyNugget'));
        if (stored && stored.date === today) return stored;
        const scriptItems = content.filter(c => c.files && c.files.script);
        if (scriptItems.length === 0) return null;
        const randomItem = scriptItems[Math.floor(Math.random() * scriptItems.length)];
        try {
            const res = await fetch(randomItem.files.script);
            const text = await res.text();
            const paragraphs = text.split(/\n\n+/).filter(p => !p.trim().startsWith('#') && p.trim().length > 60);
            if(paragraphs.length === 0) return null;
            const newNugget = {
                date: today,
                text: paragraphs[Math.floor(Math.random() * paragraphs.length)].replace(/[\*\_\[\]]/g, '').trim(),
                sourceTitle: randomItem.title, sourceId: randomItem.id, sourceUrl: randomItem.files.script
            };
            localStorage.setItem('dailyNugget', JSON.stringify(newNugget));
            return newNugget;
        } catch(e) { return null; }
    }
});