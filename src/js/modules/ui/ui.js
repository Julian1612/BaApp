const UI = {
    libraryState: 'itm_grundlagen',

    // Hilfsfunktion für echtes Random-Mischen (Fisher-Yates Shuffle)
    _shuffle: (array) => {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    },

    createCard: (item, isHighlight = false) => {
        const hasAudio = !!item.files.audio;
        const hasScript = !!item.files.script;
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
                ${hasScript ? `<button onclick="app.reader.open('${item.files.script}', '${item.title}', '${item.id}')" class="flex-1 bg-white/5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">Lesen</button>` : ''}
                ${hasAudio ? `<button onclick="app.player.load('${item.files.audio}', '${item.title}', '${item.id}')" class="flex-1 bg-white/5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">Hören</button>` : ''}
                <a href="anki://" class="flex-1 bg-gray-700 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-md transition active:bg-gray-600">
                    <i class="fas fa-star text-xs text-yellow-500"></i> Anki
                </a>
            </div>
        </div>`;
    }
};

// Globaler Alias für window.app.ui
window.UI = UI;