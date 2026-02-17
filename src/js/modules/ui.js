const UI = {
    // Zustand für den Bibliotheks-Filter (Standard: ITM)
    libraryState: 'itm_grundlagen',

    renderDashboard: (content) => {
        const container = document.getElementById('view-dashboard');
        const suggestions = SpacedRepetition.getSuggestions(content);
        
        // Begrüßung nach Tageszeit
        const hour = new Date().getHours();
        const greeting = hour < 12 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";

        let html = `
        <div class="mb-6 animate-fade-in">
            <h2 class="text-3xl font-bold text-gray-900">${greeting}</h2>
            <p class="text-gray-500">Dein Fokus für diese Woche.</p>
        </div>
        
        <div class="space-y-4">`;
        
        suggestions.forEach(item => html += UI.createCard(item, true));
        
        if (suggestions.length === 0) {
            html += `
            <div class="bg-white p-8 rounded-3xl text-center shadow-sm border border-gray-100">
                <i class="fas fa-check-circle text-4xl text-green-500 mb-3"></i>
                <p class="font-medium text-gray-900">Alles erledigt!</p>
                <p class="text-sm text-gray-500">Du bist auf dem aktuellen Stand.</p>
            </div>`;
        }
        
        html += '</div>';
        container.innerHTML = html;
    },

    renderLibrary: (content) => {
        const container = document.getElementById('view-library');
        
        // Styles für die Tabs (Aktiv vs Inaktiv)
        const activeClass = "bg-white text-gray-900 shadow-sm font-semibold ring-1 ring-black/5";
        const inactiveClass = "text-gray-500 hover:text-gray-700 font-medium hover:bg-black/5";
        
        // Filterlogik
        const isITM = UI.libraryState === 'itm_grundlagen';
        const filteredContent = content.filter(c => c.subjectKey === UI.libraryState);

        let html = `
        <div class="sticky top-0 z-20 pb-4 bg-[#f2f2f7]"> <div class="bg-gray-200/80 p-1 rounded-xl flex text-sm relative backdrop-blur-md">
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
            html += `
            <div class="flex flex-col items-center justify-center py-12 text-gray-400">
                <i class="fas fa-folder-open text-4xl mb-3 text-gray-300"></i>
                <p>Noch keine Inhalte in diesem Fach.</p>
            </div>`;
        } else {
            // Header für den Bereich
            const title = isITM ? 'ITM Grundlagen' : 'Organisation & Projekte';
            const color = isITM ? 'bg-blue-500' : 'bg-purple-500';
            
            html += `
            <div class="flex items-center gap-2 mb-2 px-1">
                <span class="w-1 h-5 ${color} rounded-full"></span>
                <h3 class="font-bold text-gray-900 text-xl">${title}</h3>
                <span class="text-xs text-gray-400 font-medium ml-auto bg-gray-100 px-2 py-1 rounded-full">${filteredContent.length} Einheiten</span>
            </div>
            `;

            // Karten rendern
            filteredContent.forEach(item => {
                html += UI.createCard(item);
            });
        }

        html += '</div>';
        container.innerHTML = html;
    },

    setLibraryFilter: (filter) => {
        UI.libraryState = filter;
        // Wir greifen auf die globalen Daten zu, um neu zu rendern
        if(app && app.data) {
            UI.renderLibrary(app.data);
        }
    },

    createCard: (item, isHighlight = false) => {
        const hasAudio = !!item.files.audio;
        const hasScript = !!item.files.script;
        
        // Farben basierend auf Fach
        const iconColor = item.subjectKey === 'itm_grundlagen' ? 'text-blue-500' : 'text-purple-500';
        const iconClass = item.subjectKey === 'itm_grundlagen' ? 'fa-network-wired' : 'fa-project-diagram';
        const bgColor = isHighlight ? 'bg-white shadow-lg ring-1 ring-blue-100' : 'bg-white shadow-sm';

        // Anki Integration Links
        // Versucht App zu öffnen, Fallback auf Web
        const ankiLink = `anki://`; 
        const ankiWebLink = `https://ankiweb.net/decks`;

        return `
        <div class="${bgColor} p-4 rounded-2xl flex flex-col gap-3 transition active:scale-[0.98] duration-200 border border-gray-100/50">
            <div class="flex justify-between items-start">
                <div class="overflow-hidden pr-2">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">${item.id}</span>
                    <h4 class="font-bold text-gray-900 leading-tight text-lg truncate">${item.title}</h4>
                </div>
                <div class="${iconColor} bg-gray-50 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                    <i class="fas ${iconClass} text-lg"></i>
                </div>
            </div>
            
            <div class="flex gap-2 mt-1">
                ${hasScript ? `
                <button onclick="app.reader.open('${item.files.script}', '${item.title}', '${item.id}')" class="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition group">
                    <i class="fas fa-align-left text-gray-400 group-hover:text-gray-600"></i> <span class="hidden sm:inline">Lesen</span>
                </button>` : ''}
                
                ${hasAudio ? `
                <button onclick="app.player.load('${item.files.audio}', '${item.title}', '${item.id}')" class="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition group">
                    <i class="fas fa-play text-gray-400 group-hover:text-gray-600"></i> <span class="hidden sm:inline">Hören</span>
                </button>` : ''}

                <a href="${ankiLink}" onclick="setTimeout(() => { window.location.href = '${ankiWebLink}'; }, 500);" class="flex-1 bg-gray-900 text-white hover:bg-gray-800 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-md shadow-gray-200 active:scale-95 transition">
                    <i class="fas fa-star text-xs text-yellow-400"></i> Anki
                </a>
            </div>
        </div>
        `;
    },

    switchTab: (tabName) => {
        // Tab-Wechsel Logik
        document.getElementById('view-dashboard').classList.add('hidden');
        document.getElementById('view-library').classList.add('hidden');
        
        // Reader ist special (Overlay)
        if(tabName !== 'reader') {
             document.getElementById('view-reader').classList.add('hidden');
             const view = document.getElementById('view-' + tabName);
             view.classList.remove('hidden');
             
             // Titel ändern
             const titles = {'dashboard': 'Dashboard', 'library': 'Bibliothek'};
             document.getElementById('page-title').innerText = titles[tabName];
             
             // Wenn wir zur Library wechseln, sicherstellen dass sie gerendert ist (mit Filter)
             if(tabName === 'library') {
                 UI.renderLibrary(app.data);
             }

             // Navigation Active State
             document.querySelectorAll('.nav-btn').forEach(btn => {
                 btn.classList.remove('text-blue-600', 'active');
                 btn.classList.add('text-gray-400');
             });
             const activeBtn = document.querySelector(`button[onclick*="${tabName}"]`);
             if(activeBtn) {
                 activeBtn.classList.remove('text-gray-400');
                 activeBtn.classList.add('text-blue-600', 'active');
             }
        }
    }
};