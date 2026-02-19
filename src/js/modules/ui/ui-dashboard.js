Object.assign(UI, {
    renderDashboard: async (content) => {
        const container = document.getElementById('view-dashboard');
        if (!container) return; 

        try {
            const daily = SpacedRepetition.getDailyFocus(content);
            const weekly = SpacedRepetition.getWeeklyPlan(content);
            const nugget = await UI.getDailyNugget(content);

            let html = `
            <div class="space-y-8 pb-32 animate-fade-in">
                <!-- DAILY HERO -->
                <section>
                    <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Dein Fokus Heute</h3>
                    ${UI._renderHeroCard(daily)}
                </section>

                <!-- WEEKLY GOALS -->
                <section>
                    <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Wochenziel (KW ${UI._getWeekNumber()})</h3>
                    <div class="grid grid-cols-2 gap-3">
                        ${UI._renderMiniCard(weekly.itm, 'ITM', 'text-blue-400', 'bg-blue-500/10')}
                        ${UI._renderMiniCard(weekly.org, 'ORG', 'text-purple-400', 'bg-purple-500/10')}
                    </div>
                </section>

                <!-- NUGGET -->
                ${nugget ? UI._renderNugget(nugget) : ''}
            </div>
            
            <!-- ACTION SHEET MODAL -->
            <div id="dashboard-action-sheet" class="hidden fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:px-4">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onclick="UI.closeActionSheet()"></div>
                <div class="bg-[#1c1c1e] border-t sm:border border-white/10 w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl shadow-2xl transform transition-all relative z-10 overflow-hidden p-6 pb-safe">
                    <div class="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 sm:hidden"></div>
                    <h3 class="text-white font-bold text-xl mb-6 text-center">Wie möchtest du lernen?</h3>
                    <div id="action-sheet-options" class="flex flex-col gap-3"></div>
                    <button onclick="UI.closeActionSheet()" class="mt-6 w-full py-4 rounded-xl text-gray-400 font-medium bg-white/5 hover:bg-white/10 transition">Abbrechen</button>
                </div>
            </div>`;
            
            container.innerHTML = html;
        } catch (e) {
            console.error("Dashboard Render Error:", e);
            container.innerHTML = '<div class="text-center py-10 text-gray-500">Fehler beim Laden des Dashboards.</div>';
        }
    },

    getDailyNugget: async (content) => {
        const today = new Date().toDateString();
        const stored = JSON.parse(localStorage.getItem('dailyNugget'));
        if (stored && stored.date === today) return stored;
        const scriptItems = content.filter(c => c.files && c.files.script);
        if (scriptItems.length === 0) return null;
        
        for (let i = 0; i < 3; i++) {
            const randomItem = scriptItems[Math.floor(Math.random() * scriptItems.length)];
            try {
                const res = await fetch(randomItem.files.script);
                const text = await res.text();
                const paragraphs = text.split(/\n\n+/).filter(p => !p.trim().startsWith('#') && p.trim().length > 60);
                
                if (paragraphs.length > 0) {
                    const rawText = paragraphs[Math.floor(Math.random() * paragraphs.length)];
                    const cleanText = rawText.replace(/[\*\_\[\]\`]/g, '').trim();
                    
                    const newNugget = {
                        date: today,
                        text: cleanText,
                        sourceTitle: randomItem.title, 
                        sourceId: randomItem.id, 
                        sourceUrl: randomItem.files.script
                    };
                    localStorage.setItem('dailyNugget', JSON.stringify(newNugget));
                    return newNugget;
                }
            } catch(e) { console.log("Nugget fetch failed", e); }
        }
        return null;
    },

    openContentSelection: async (id) => {
        const item = window.app.data.find(i => i.id === id);
        if (!item) return;

        const optionsContainer = document.getElementById('action-sheet-options');
        const sheet = document.getElementById('dashboard-action-sheet');
        if(!optionsContainer || !sheet) return;

        let html = '';
        
        // SCRIPT
        if (item.files.script) {
            html += `
            <button onclick="app.reader.open('${item.files.script}', '${item.title.replace(/'/g, "\\'")}', '${item.id}'); UI.closeActionSheet()" class="w-full bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white p-4 rounded-xl flex items-center gap-4 transition group">
                <div class="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center group-active:scale-90 transition"><i class="fas fa-align-left text-xl"></i></div>
                <div class="text-left"><div class="font-bold">Lesen</div><div class="text-xs text-gray-400">Skript öffnen</div></div>
                <i class="fas fa-chevron-right text-gray-600 ml-auto"></i>
            </button>`;
        }

        // PODCAST
        if (item.files.audio) {
            html += `
            <button onclick="app.player.load('${item.files.audio}', '${item.title.replace(/'/g, "\\'")}', '${item.id}'); UI.closeActionSheet()" class="w-full bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white p-4 rounded-xl flex items-center gap-4 transition group">
                <div class="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-active:scale-90 transition"><i class="fas fa-headphones text-xl"></i></div>
                <div class="text-left"><div class="font-bold">Hören</div><div class="text-xs text-gray-400">Podcast starten</div></div>
                <i class="fas fa-chevron-right text-gray-600 ml-auto"></i>
            </button>`;
        }

        // FLASHCARDS (Dynamic Check)
        const flashcardUrl = `content/${item.subjectKey}/flashcards/${item.id}.csv`;
        try {
            const res = await fetch(flashcardUrl, { method: 'HEAD' });
            if (res.ok) {
                html += `
                <button onclick="Flashcards.open('${item.id}'); UI.closeActionSheet()" class="w-full bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white p-4 rounded-xl flex items-center gap-4 transition group">
                    <div class="w-12 h-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center group-active:scale-90 transition"><i class="fas fa-clone text-xl"></i></div>
                    <div class="text-left"><div class="font-bold">Lernen</div><div class="text-xs text-gray-400">Karteikarten</div></div>
                    <i class="fas fa-chevron-right text-gray-600 ml-auto"></i>
                </button>`;
            }
        } catch(e) {}

        // VIDEO (Placeholder)
        if (item.files.video) {
             html += `
            <button onclick="/* Video Logic */" class="w-full bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white p-4 rounded-xl flex items-center gap-4 transition group opacity-50 cursor-not-allowed">
                <div class="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center"><i class="fas fa-play text-xl"></i></div>
                <div class="text-left"><div class="font-bold">Video</div><div class="text-xs text-gray-400">Bald verfügbar</div></div>
            </button>`;
        }

        optionsContainer.innerHTML = html;
        sheet.classList.remove('hidden');
    },

    closeActionSheet: () => {
        document.getElementById('dashboard-action-sheet').classList.add('hidden');
    },

    _renderHeroCard: (item) => {
        if (!item) return '<div class="p-6 bg-[#1c1c1e] rounded-2xl text-center text-gray-500">Alles erledigt!</div>';
        return `
        <div onclick="UI.openContentSelection('${item.id}')" class="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 shadow-2xl shadow-blue-900/40 active:scale-[0.98] transition cursor-pointer">
            <div class="relative z-10 flex flex-col h-full">
                <div class="flex justify-between items-start mb-4">
                    <span class="bg-black/20 text-white/90 text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">PRIORITÄT</span>
                    <i class="fas fa-play-circle text-3xl text-white/80"></i>
                </div>
                <h2 class="text-2xl font-bold text-white leading-tight mb-1">${item.title}</h2>
                <p class="text-blue-100 text-sm opacity-80 line-clamp-2">Tippe zum Starten</p>
            </div>
            <div class="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>`;
    },

    _renderMiniCard: (item, label, colorText, colorBg) => {
        if (!item) return '';
        return `
        <div onclick="UI.openContentSelection('${item.id}')" class="bg-[#1c1c1e] p-4 rounded-2xl border border-white/5 active:scale-95 transition cursor-pointer h-full flex flex-col">
            <span class="${colorBg} ${colorText} text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block self-start">${label}</span>
            <h4 class="text-white font-bold text-sm leading-snug line-clamp-3 mb-2 flex-1">${item.title}</h4>
            <div class="flex gap-2 mt-auto opacity-50">
                ${item.files.script ? '<i class="fas fa-align-left text-xs"></i>' : ''}
                ${item.files.audio ? '<i class="fas fa-headphones text-xs"></i>' : ''}
            </div>
        </div>`;
    },

    _renderNugget: (nugget) => `
        <div class="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-5 rounded-3xl relative overflow-hidden">
            <div class="flex items-center gap-2 mb-3">
                <i class="fas fa-lightbulb text-yellow-500"></i>
                <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Wissen des Tages</span>
            </div>
            <p class="text-gray-200 text-base font-medium italic leading-relaxed">"${nugget.text}"</p>
        </div>`,

    _getWeekNumber: () => {
        const d = new Date();
        d.setHours(0,0,0,0);
        d.setDate(d.getDate() + 4 - (d.getDay()||7));
        return Math.ceil((((d-new Date(d.getFullYear(),0,1))/86400000)+1)/7);
    }
});