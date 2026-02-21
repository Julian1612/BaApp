Object.assign(UI, {
    renderDashboard: async (content) => {
        const container = document.getElementById('view-dashboard');
        if (!container) return; 

        try {
            const suggestions = SpacedRepetition.getRankedSuggestions(content);
            const daily = SpacedRepetition.getDailyPicks(suggestions);
            const weekly = SpacedRepetition.getWeeklyPlan(content, suggestions);

            let html = `
            <div class="space-y-8 pb-32 animate-fade-in">
                <section>
                    <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Vorschläge für Heute</h3>
                    <div class="space-y-3">
                        ${UI._renderDailyPickCard(daily.script, 'Skript des Tages', 'fa-align-left', 'yellow')}
                        ${UI._renderDailyPickCard(daily.audio, 'Podcast des Tages', 'fa-headphones', 'blue')}
                        ${UI._renderDailyPickCard(daily.flashcards, 'Karten des Tages', 'fa-clone', 'green')}
                    </div>
                </section>

                <section>
                    <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Wochenziele (KW ${SpacedRepetition._getWeekNumber()})</h3>
                    <div class="grid grid-cols-2 gap-3">
                        ${UI._renderMiniCard(weekly.itm, 'ITM', 'text-blue-400', 'bg-blue-500/10')}
                        ${UI._renderMiniCard(weekly.org, 'ORG', 'text-purple-400', 'bg-purple-500/10')}
                    </div>
                </section>
            </div>
            
            <div id="dashboard-action-sheet" class="hidden fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:px-4">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="UI.closeActionSheet()"></div>
                <div class="bg-[#1c1c1e] border-t sm:border border-white/10 w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl shadow-2xl relative z-10 p-6" style="padding-bottom: max(env(safe-area-inset-bottom), 24px);">
                    <h3 id="action-sheet-title" class="text-white font-bold text-xl mb-6 text-center">Wie möchtest du lernen?</h3>
                    <div id="action-sheet-options" class="flex flex-col gap-3"></div>
                    <button onclick="UI.closeActionSheet()" class="mt-6 w-full py-4 rounded-xl text-gray-400 font-medium bg-white/5">Abbrechen</button>
                </div>
            </div>`;
            
            container.innerHTML = html;
        } catch (e) {
            console.error("Dashboard Render Error:", e);
            container.innerHTML = '<div class="text-center py-10 text-gray-500">Fehler beim Laden des Dashboards.</div>';
        }
    },
    
    _renderDailyPickCard: (item, label, icon, color) => {
        if (!item) return '';

        let action = '';
        switch(label) {
            case 'Skript des Tages':
                action = `app.reader.open('${item.files.script}', '${item.title.replace(/'/g, "\\'")}', '${item.id}')`;
                break;
            case 'Podcast des Tages':
                action = `app.player.load('${item.files.audio}', '${item.title.replace(/'/g, "\\'")}', '${item.id}')`;
                break;
            case 'Karten des Tages':
                action = `Flashcards.open('${item.id}')`;
                break;
            default:
                action = `UI.openContentSelection('${item.id}')`;
        }

        const colors = {
            yellow: 'bg-yellow-500/10 text-yellow-400',
            blue: 'bg-blue-500/10 text-blue-400',
            green: 'bg-green-500/10 text-green-400'
        };
        return `
        <div onclick="${action}" class="bg-[#1c1c1e] p-4 rounded-2xl border border-white/5 flex items-center gap-4 active:scale-[0.98] transition cursor-pointer">
            <div class="w-12 h-12 rounded-full ${colors[color]} flex items-center justify-center text-xl"><i class="fas ${icon}"></i></div>
            <div class="flex-1 min-w-0">
                <p class="text-[10px] font-bold uppercase tracking-wider text-gray-500">${label}</p>
                <h4 class="text-white font-bold text-sm leading-tight truncate">${item.title}</h4>
            </div>
            <i class="fas fa-chevron-right text-gray-600"></i>
        </div>`;
    },

    _renderMiniCard: (item, label, colorText, colorBg) => {
        if (!item) return '<div class="bg-[#1c1c1e] p-4 rounded-2xl border border-white/5 opacity-50"><h4 class="text-gray-600 font-bold text-sm">Nicht verfügbar</h4></div>';
        return `
        <div onclick="UI.openContentSelection('${item.id}')" class="bg-[#1c1c1e] p-4 rounded-2xl border border-white/5 active:scale-95 transition cursor-pointer h-full flex flex-col">
            <span class="${colorBg} ${colorText} text-[10px] font-bold px-2 py-1 rounded mb-2 self-start">${label}</span>
            <h4 class="text-white font-bold text-sm leading-snug line-clamp-3 mb-2 flex-1">${item.title}</h4>
        </div>`;
    },

    openContentSelection: async (id) => {
        const item = window.app.data.find(i => i.id === id);
        if (!item) return;

        const optionsContainer = document.getElementById('action-sheet-options');
        const sheet = document.getElementById('dashboard-action-sheet');
        const title = document.getElementById('action-sheet-title');
        if(!optionsContainer || !sheet || !title) return;

        title.innerText = item.title;
        let html = '';
        
        if (item.files.script) { html += `<button onclick="app.reader.open('${item.files.script}', '${item.title.replace(/'/g, "\\'")}', '${item.id}'); UI.closeActionSheet()" class="w-full bg-[#2c2c2e] p-4 rounded-xl flex items-center gap-4"><div class="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center"><i class="fas fa-align-left text-xl"></i></div><div class="text-left font-bold">Lesen</div></button>`; }
        if (item.files.audio) { html += `<button onclick="app.player.load('${item.files.audio}', '${item.title.replace(/'/g, "\\'")}', '${item.id}'); UI.closeActionSheet()" class="w-full bg-[#2c2c2e] p-4 rounded-xl flex items-center gap-4"><div class="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center"><i class="fas fa-headphones text-xl"></i></div><div class="text-left font-bold">Hören</div></button>`; }

        const flashcardUrl = `content/${item.subjectKey}/flashcards/${item.id}.csv`;
        try {
            const res = await fetch(flashcardUrl, { method: 'HEAD' });
            if (res.ok) { html += `<button onclick="Flashcards.open('${item.id}'); UI.closeActionSheet()" class="w-full bg-[#2c2c2e] p-4 rounded-xl flex items-center gap-4"><div class="w-12 h-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center"><i class="fas fa-clone text-xl"></i></div><div class="text-left font-bold">Lernen</div></button>`; }
        } catch(e) {}

        optionsContainer.innerHTML = html;
        sheet.classList.remove('hidden');
    },
    closeActionSheet: () => { 
        const sheet = document.getElementById('dashboard-action-sheet');
        if (sheet) sheet.classList.add('hidden');
    }
});