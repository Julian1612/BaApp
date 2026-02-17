/* src/js/modules/ui-library.js */
Object.assign(UI, {
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
    }
});