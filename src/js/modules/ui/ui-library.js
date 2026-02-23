Object.assign(UI, {
    renderLibrary: async (content) => {
        const container = document.getElementById('view-library');
        if (!container) return;
        
        const isITM = UI.libraryState === 'itm_grundlagen';
        const filteredContent = content.filter(c => c.subjectKey === UI.libraryState);
        const activeClass = "bg-gray-700 text-white";
        const inactiveClass = "text-gray-400 hover:bg-white/5";

        let cardsHtml = '';
        // Use for...of loop with await to handle async card creation
        for (const item of filteredContent) {
            cardsHtml += await UI.createCard(item);
        }

        const html = `
        <div class="sticky top-0 z-20 pb-4 bg-black"> 
            <div class="bg-[#1c1c1e] p-1 rounded-xl flex text-sm border border-white/10">
                <button onclick="app.ui.setLibraryFilter('itm_grundlagen')" class="flex-1 py-1.5 rounded-lg transition ${isITM ? activeClass : inactiveClass}">ITM Grundlagen</button>
                <button onclick="app.ui.setLibraryFilter('organisation_projekte')" class="flex-1 py-1.5 rounded-lg transition ${!isITM ? activeClass : inactiveClass}">Org & Projekte</button>
            </div>
        </div>
        <div class="space-y-4 pb-24 animate-fade-in">
            ${cardsHtml.length > 0 ? cardsHtml : `<div class="text-center py-12 text-gray-500"><p>Leer.</p></div>`}
        </div>`;
        
        container.innerHTML = html;
    },

    setLibraryFilter: (filter) => {
        UI.libraryState = filter;
        if(window.app && window.app.data) UI.renderLibrary(window.app.data); // This call is now async
    }
});