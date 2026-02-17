const UI = {
    renderDashboard: (content) => {
        const container = document.getElementById('view-dashboard');
        const suggestions = SpacedRepetition.getSuggestions(content);
        
        let html = '<div class="space-y-4">';
        html += '<div class="bg-blue-50 p-4 rounded-xl border border-blue-100"><h3 class="font-bold text-blue-800 mb-2">Wochen-Fokus</h3><p class="text-sm text-blue-600 mb-3">Diese 2 Themen solltest du wiederholen:</p>';
        
        suggestions.forEach(item => {
            html += UI.createCard(item);
        });
        
        if (suggestions.length === 0) html += '<p>Alles erledigt! Entspann dich.</p>';
        html += '</div></div>';
        
        container.innerHTML = html;
    },

    renderLibrary: (content) => {
        const container = document.getElementById('view-library');
        // Gruppieren nach Fach
        const itm = content.filter(c => c.subjectKey === 'itm_grundlagen');
        const org = content.filter(c => c.subjectKey === 'organisation_projekte');
        
        let html = '<div class="space-y-6">';
        
        html += '<div><h3 class="font-bold text-gray-500 uppercase text-xs tracking-wider mb-2">ITM Grundlagen</h3>';
        itm.forEach(item => html += UI.createCard(item));
        html += '</div>';

        html += '<div><h3 class="font-bold text-gray-500 uppercase text-xs tracking-wider mb-2">Org & Projekte</h3>';
        org.forEach(item => html += UI.createCard(item));
        html += '</div></div>';

        container.innerHTML = html;
    },

    createCard: (item) => {
        const hasAudio = item.files.audio ? true : false;
        const hasScript = item.files.script ? true : false;

        return `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 flex justify-between items-center">
            <div class="overflow-hidden">
                <h4 class="font-bold text-gray-800 truncate">${item.title}</h4>
                <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">${item.subject}</span>
            </div>
            <div class="flex gap-2 shrink-0">
                ${hasScript ? `<button onclick="app.reader.open('${item.files.script}', '${item.title}', '${item.id}')" class="w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center"><i class="fas fa-book-open"></i></button>` : ''}
                ${hasAudio ? `<button onclick="app.player.load('${item.files.audio}', '${item.title}', '${item.id}')" class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center"><i class="fas fa-play"></i></button>` : ''}
            </div>
        </div>
        `;
    },

    switchTab: (tabName) => {
        // Views umschalten
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        document.getElementById(`view-${tabName}`).classList.remove('hidden');
        
        // Titel ändern
        const titles = {'dashboard': 'Fokus', 'library': 'Bibliothek', 'reader': 'Reader'};
        document.getElementById('page-title').innerText = titles[tabName] || 'Study App';

        // Nav Active State (nur für Haupttabs)
        if (tabName !== 'reader') {
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active', 'text-blue-600'));
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.add('text-gray-400'));
            
            // Finde den passenden Button (einfacher Hack über onclick Attribut checken)
            const activeBtn = document.querySelector(`button[onclick*="${tabName}"]`);
            if(activeBtn) {
                activeBtn.classList.add('active', 'text-blue-600');
                activeBtn.classList.remove('text-gray-400');
            }
        }
    }
};