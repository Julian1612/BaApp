/* src/js/modules/ui.js */
const UI = {
    libraryState: 'itm_grundlagen',

    renderDashboard: async (content) => {
        const container = document.getElementById('view-dashboard');
        if (!container) return; 

        const suggestions = SpacedRepetition.getSuggestions(content);
        const hour = new Date().getHours();
        const greeting = hour < 12 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";

        let nuggetHtml = '';
        try {
            const nugget = await UI.getDailyNugget(content);
            if(nugget) {
                nuggetHtml = `
                <div class="mb-6 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-5 rounded-3xl shadow-lg relative overflow-hidden group">
                     <div class="relative z-10">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-[10px] font-bold uppercase tracking-wider text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">Wissen des Tages</span>
                        </div>
                        <p class="text-gray-200 text-lg font-medium leading-relaxed italic">"${nugget.text}"</p>
                        <button onclick="app.reader.open('${nugget.sourceUrl}', '${nugget.sourceTitle}', '${nugget.sourceId}')" class="mt-4 text-sm text-blue-400 font-medium hover:text-blue-300 transition flex items-center gap-1">
                            Zum Skript <i class="fas fa-arrow-right text-xs"></i>
                        </button>
                     </div>
                </div>`;
            }
        } catch(e) { console.error(e); }

        let html = `
        ${nuggetHtml}
        <h3 class="font-bold text-gray-300 mb-3 px-1 text-sm uppercase tracking-wider">Fokus der Woche</h3>
        <div class="space-y-4">`;
        
        suggestions.forEach(item => html += UI.createCard(item, true));
        
        if (suggestions.length === 0) {
            html += `
            <div class="bg-gray-800 p-8 rounded-3xl text-center border border-gray-700">
                <p class="font-medium text-white">Alles erledigt!</p>
            </div>`;
        }
        
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
                text: paragraphs[Math.floor(Math.random() * paragraphs.length)].replace(/[\*\_\[\]]/g, ''),
                sourceTitle: randomItem.title,
                sourceId: randomItem.id,
                sourceUrl: randomItem.files.script
            };
            localStorage.setItem('dailyNugget', JSON.stringify(newNugget));
            return newNugget;
        } catch(e) { return null; }
    },

    renderLibrary: (content) => {
        const container = document.getElementById('view-library');
        if (!container) return;

        const isITM = UI.libraryState === 'itm_grundlagen';
        const filteredContent = content.filter(c => c.subjectKey === UI.libraryState);
        const activeClass = "bg-gray-700 text-white shadow-sm font-semibold";
        const inactiveClass = "text-gray-400 hover:text-white font-medium hover:bg-white/5";

        let html = `
        <div class="sticky top-0 z-20 pb-4 bg-black"> 
            <div class="bg-[#1c1c1e] p-1 rounded-xl flex text-sm border border-white/10">
                <button onclick="app.ui.setLibraryFilter('itm_grundlagen')" class="flex-1 py-1.5 rounded-lg transition ${isITM ? activeClass : inactiveClass}">ITM Grundlagen</button>
                <button onclick="app.ui.setLibraryFilter('organisation_projekte')" class="flex-1 py-1.5 rounded-lg transition ${!isITM ? activeClass : inactiveClass}">Org & Projekte</button>
            </div>
        </div>
        <div class="space-y-4 pb-24 animate-fade-in">`;
        
        if (filteredContent.length === 0) html += `<div class="text-center py-12 text-gray-500"><p>Leer.</p></div>`;
        else filteredContent.forEach(item => html += UI.createCard(item));
        
        html += '</div>';
        container.innerHTML = html;
    },

    setLibraryFilter: (filter) => {
        UI.libraryState = filter;
        if(app && app.data) UI.renderLibrary(app.data);
    },

    createCard: (item, isHighlight = false) => {
        const hasAudio = !!item.files.audio;
        const hasScript = !!item.files.script;
        const iconColor = item.subjectKey === 'itm_grundlagen' ? 'text-blue-400' : 'text-purple-400';
        const bgColor = isHighlight ? 'bg-gray-800 border-gray-600 shadow-lg' : 'bg-[#1c1c1e] border-white/5';
        
        // Link für den App-Switch zu Anki
        const ankiLink = "anki://";

        return `
        <div class="${bgColor} p-4 rounded-2xl flex flex-col gap-3 transition active:scale-[0.98] duration-200 border">
            <div class="flex justify-between items-start">
                <div class="overflow-hidden pr-2">
                    <span class="text-[10px] font-bold uppercase text-gray-500">${item.id}</span>
                    <h4 class="font-bold text-white text-lg truncate">${item.title}</h4>
                </div>
                <div class="${iconColor} bg-white/5 w-10 h-10 rounded-full flex items-center justify-center border border-white/5"><i class="fas fa-layer-group"></i></div>
            </div>
            <div class="flex gap-2 mt-1">
                ${hasScript ? `<button onclick="app.reader.open('${item.files.script}', '${item.title}', '${item.id}')" class="flex-1 bg-white/5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">Lesen</button>` : ''}
                ${hasAudio ? `<button onclick="app.player.load('${item.files.audio}', '${item.title}', '${item.id}')" class="flex-1 bg-white/5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">Hören</button>` : ''}
                
                <a href="${ankiLink}" class="flex-1 bg-gray-700 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-md transition active:bg-gray-600">
                    <i class="fas fa-star text-xs text-yellow-500"></i> Anki
                </a>
            </div>
        </div>`;
    },

    switchTab: (tabName) => {
        const header = document.getElementById('main-header');
        const scrollWrapper = document.getElementById('scroll-wrapper');
        const viewForyou = document.getElementById('view-foryou');
        
        if(document.getElementById('view-dashboard')) document.getElementById('view-dashboard').classList.add('hidden');
        if(document.getElementById('view-library')) document.getElementById('view-library').classList.add('hidden');
        if(viewForyou) viewForyou.classList.add('hidden');

        if (tabName === 'foryou') {
            if(scrollWrapper) scrollWrapper.classList.add('hidden');
            if(viewForyou) viewForyou.classList.remove('hidden');
            if(header) header.classList.add('-translate-y-full');
            if(window.app && window.app.foryou) window.app.foryou.render(window.app.data);
        } else {
            if(viewForyou) viewForyou.classList.add('hidden');
            if(scrollWrapper) scrollWrapper.classList.remove('hidden');
            if(header) header.classList.remove('-translate-y-full');
            if(window.app && window.app.foryou) window.app.foryou.pauseAll();

            if (tabName === 'dashboard') {
                document.getElementById('view-dashboard').classList.remove('hidden');
                UI.renderDashboard(app.data);
                document.getElementById('page-title').innerText = 'Dashboard';
            }
            if (tabName === 'library') {
                document.getElementById('view-library').classList.remove('hidden');
                UI.renderLibrary(app.data);
                document.getElementById('page-title').innerText = 'Bibliothek';
            }
        }

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('text-blue-500', 'active', 'text-white');
            btn.classList.add('text-gray-500');
        });
        const activeBtn = document.querySelector(`button[onclick*="${tabName}"]`);
        if(activeBtn) {
            activeBtn.classList.remove('text-gray-500');
            if(tabName === 'foryou') activeBtn.classList.add('text-white', 'active');
            else activeBtn.classList.add('text-blue-500', 'active');
        }
    }
};