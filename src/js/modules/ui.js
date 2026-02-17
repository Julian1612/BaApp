const UI = {
    libraryState: 'itm_grundlagen',

    renderDashboard: async (content) => {
        const container = document.getElementById('view-dashboard');
        const suggestions = SpacedRepetition.getSuggestions(content);
        const hour = new Date().getHours();
        const greeting = hour < 12 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";

        // 1. Daily Nugget laden (Wissen des Tages)
        let nuggetHtml = '';
        try {
            const nugget = await UI.getDailyNugget(content);
            if(nugget) {
                nuggetHtml = `
                <div class="mb-6 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-5 rounded-3xl shadow-lg relative overflow-hidden group">
                     <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <i class="fas fa-lightbulb text-6xl text-yellow-500"></i>
                     </div>
                     <div class="relative z-10">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-[10px] font-bold uppercase tracking-wider text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">Wissen des Tages</span>
                            <span class="text-[10px] text-gray-400">${nugget.sourceTitle}</span>
                        </div>
                        <p class="text-gray-200 text-lg font-medium leading-relaxed italic">"${nugget.text}"</p>
                        <button onclick="app.reader.open('${nugget.sourceUrl}', '${nugget.sourceTitle}', '${nugget.sourceId}')" class="mt-4 text-sm text-blue-400 font-medium hover:text-blue-300 transition flex items-center gap-1">
                            Ganzes Skript lesen <i class="fas fa-arrow-right text-xs"></i>
                        </button>
                     </div>
                </div>`;
            }
        } catch(e) { console.error(e); }

        // Dashboard HTML zusammenbauen
        let html = `
        <div class="mb-6 animate-fade-in">
            <h2 class="text-3xl font-bold text-white mb-1">${greeting}</h2>
            <p class="text-gray-400">Lerne heute etwas Neues.</p>
        </div>
        
        ${nuggetHtml}
        
        <h3 class="font-bold text-gray-300 mb-3 px-1 text-sm uppercase tracking-wider">Fokus der Woche</h3>
        <div class="space-y-4">`;
        
        suggestions.forEach(item => html += UI.createCard(item, true));
        
        if (suggestions.length === 0) {
            html += `
            <div class="bg-gray-800 p-8 rounded-3xl text-center border border-gray-700">
                <i class="fas fa-check-circle text-4xl text-green-500 mb-3"></i>
                <p class="font-medium text-white">Alles erledigt!</p>
            </div>`;
        }
        
        html += '</div>';
        container.innerHTML = html;
    },

    // Die Logik für den zufälligen Happen
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
            
            // Paragraphen extrahieren (ohne Überschriften/Bilder)
            const paragraphs = text.split(/\n\n+/).filter(p => 
                !p.trim().startsWith('#') && 
                !p.trim().startsWith('![') && 
                p.trim().length > 60 && 
                p.trim().length < 400
            );

            if(paragraphs.length === 0) return null;

            const randomPara = paragraphs[Math.floor(Math.random() * paragraphs.length)];
            const cleanText = randomPara.replace(/[\*\_\[\]]/g, '');

            const newNugget = {
                date: today,
                text: cleanText,
                sourceTitle: randomItem.title,
                sourceId: randomItem.id,
                sourceUrl: randomItem.files.script
            };

            localStorage.setItem('dailyNugget', JSON.stringify(newNugget));
            return newNugget;

        } catch(e) {
            console.error("Nugget Error", e);
            return null;
        }
    },

    renderLibrary: (content) => {
        const container = document.getElementById('view-library');
        const activeClass = "bg-gray-700 text-white shadow-sm font-semibold";
        const inactiveClass = "text-gray-400 hover:text-white font-medium hover:bg-white/5";
        
        const isITM = UI.libraryState === 'itm_grundlagen';
        const filteredContent = content.filter(c => c.subjectKey === UI.libraryState);

        let html = `
        <div class="sticky top-0 z-20 pb-4 bg-black"> 
            <div class="bg-[#1c1c1e] p-1 rounded-xl flex text-sm border border-white/10">
                <button onclick="app.ui.setLibraryFilter('itm_grundlagen')" 
                    class="flex-1 py-1.5 rounded-lg transition-all duration-200 ${isITM ? activeClass : inactiveClass}">
                    ITM Grundlagen
                </button>
                <button onclick="app.ui.setLibraryFilter('organisation_projekte')" 
                    class="flex-1 py-1.5 rounded-lg transition-all duration-200 ${!isITM ? activeClass : inactiveClass}">
                    Org & Projekte
                </button>
            </div>
        </div>
        <div class="space-y-4 pb-24 animate-fade-in">
        `;
        
        if (filteredContent.length === 0) {
            html += `<div class="text-center py-12 text-gray-500"><p>Leer.</p></div>`;
        } else {
            const title = isITM ? 'ITM Grundlagen' : 'Org & Projekte';
            const color = isITM ? 'bg-blue-500' : 'bg-purple-500';
            
            html += `
            <div class="flex items-center gap-2 mb-2 px-1">
                <span class="w-1 h-5 ${color} rounded-full"></span>
                <h3 class="font-bold text-white text-xl">${title}</h3>
                <span class="text-xs text-gray-500 font-medium ml-auto border border-gray-700 px-2 py-1 rounded-full">${filteredContent.length}</span>
            </div>
            `;
            filteredContent.forEach(item => html += UI.createCard(item));
        }
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
        const iconClass = item.subjectKey === 'itm_grundlagen' ? 'fa-network-wired' : 'fa-project-diagram';
        const bgColor = isHighlight ? 'bg-gray-800 border-gray-600 shadow-lg' : 'bg-[#1c1c1e] border-white/5';

        // Anki Link pur: Nur Protokoll, kein Web-Link Fallback
        const ankiLink = `anki://`; 

        return `
        <div class="${bgColor} p-4 rounded-2xl flex flex-col gap-3 transition active:scale-[0.98] duration-200 border">
            <div class="flex justify-between items-start">
                <div class="overflow-hidden pr-2">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">${item.id}</span>
                    <h4 class="font-bold text-white leading-tight text-lg truncate">${item.title}</h4>
                </div>
                <div class="${iconColor} bg-white/5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white/5">
                    <i class="fas ${iconClass} text-lg"></i>
                </div>
            </div>
            
            <div class="flex gap-2 mt-1">
                ${hasScript ? `
                <button onclick="app.reader.open('${item.files.script}', '${item.title}', '${item.id}')" class="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition">
                    <i class="fas fa-align-left text-gray-500"></i> <span class="hidden sm:inline">Lesen</span>
                </button>` : ''}
                
                ${hasAudio ? `
                <button onclick="app.player.load('${item.files.audio}', '${item.title}', '${item.id}')" class="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition">
                    <i class="fas fa-play text-gray-500"></i> <span class="hidden sm:inline">Hören</span>
                </button>` : ''}

                <a href="${ankiLink}" class="flex-1 bg-gray-700 text-white hover:bg-gray-600 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-md transition">
                    <i class="fas fa-star text-xs text-yellow-500"></i> Anki
                </a>
            </div>
        </div>
        `;
    },

    switchTab: (tabName) => {
        document.getElementById('view-dashboard').classList.add('hidden');
        document.getElementById('view-library').classList.add('hidden');
        if(tabName !== 'reader') {
             document.getElementById('view-reader').classList.add('hidden');
             document.getElementById('view-' + tabName).classList.remove('hidden');
             const titles = {'dashboard': 'Dashboard', 'library': 'Bibliothek'};
             document.getElementById('page-title').innerText = titles[tabName];
             if(tabName === 'library') UI.renderLibrary(app.data);
             if(tabName === 'dashboard') UI.renderDashboard(app.data); 

             document.querySelectorAll('.nav-btn').forEach(btn => {
                 btn.classList.remove('text-blue-500', 'active');
                 btn.classList.add('text-gray-500');
             });
             const activeBtn = document.querySelector(`button[onclick*="${tabName}"]`);
             if(activeBtn) {
                 activeBtn.classList.remove('text-gray-500');
                 activeBtn.classList.add('text-blue-500', 'active');
             }
        }
    }
};