const UI = {
    libraryState: 'itm_grundlagen',

    _shuffle: (array) => { /* ... */ return array; },

    createCard: async (item, isHighlight = false) => {
        const hasAudio = !!item.files.audio;
        const hasScript = !!item.files.script;
        let hasFlashcards = false;

        // Async check for flashcards
        const flashcardUrl = `content/${item.subjectKey}/flashcards/${item.id}.csv`;
        try {
            const res = await fetch(flashcardUrl, { method: 'HEAD' });
            if (res.ok) hasFlashcards = true;
        } catch (e) {}

        const iconColor = item.subjectKey === 'itm_grundlagen' ? 'text-blue-400' : 'text-purple-400';
        const bgColor = isHighlight ? 'bg-gray-800 border-gray-600 shadow-lg' : 'bg-[#1c1c1e] border-white/5';
        
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
                ${hasScript ? `<button onclick="app.reader.open('${item.files.script}', '${item.title.replace(/'/g, "\\'")}', '${item.id}')" class="flex-1 bg-white/5 py-2.5 rounded-xl text-sm font-medium">Lesen</button>` : ''}
                ${hasAudio ? `<button onclick="app.player.load('${item.files.audio}', '${item.title.replace(/'/g, "\\'")}', '${item.id}')" class="flex-1 bg-white/5 py-2.5 rounded-xl text-sm font-medium">Hören</button>` : ''}
                ${hasFlashcards ? `<button onclick="Flashcards.open('${item.id}')" class="flex-1 bg-green-500/10 text-green-500 py-2.5 rounded-xl text-sm font-medium border border-green-500/20">Lernen</button>` : ''}
            </div>
        </div>`;
    }
};

window.UI = UI;