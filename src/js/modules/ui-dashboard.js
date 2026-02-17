Object.assign(window.UI, {
    renderDashboard: async (content) => {
        const container = document.getElementById('view-dashboard');
        if (!container) return;
        const suggestions = SpacedRepetition.getSuggestions(content);
        let html = `<h3 class="font-bold text-gray-300 mb-3 text-sm uppercase tracking-wider">Fokus der Woche</h3><div class="space-y-4">`;
        suggestions.forEach(item => html += UI.createCard(item, true));
        container.innerHTML = html + '</div>';
    },
    createCard: (item, isHighlight = false) => {
        const hasAudio = !!item.files.audio;
        const iconColor = item.subjectKey === 'itm_grundlagen' ? 'text-blue-400' : 'text-purple-400';
        return `
        <div class="bg-[#1c1c1e] p-4 rounded-2xl border border-white/5 mb-4">
            <div class="flex justify-between items-start mb-4">
                <div><span class="text-[10px] font-bold uppercase text-gray-500">${item.id}</span><h4 class="font-bold text-white text-lg">${item.title}</h4></div>
                <div class="${iconColor} bg-white/5 w-10 h-10 rounded-full flex items-center justify-center"><i class="fas fa-layer-group"></i></div>
            </div>
            <div class="flex gap-2">
                <button onclick="app.reader.open('${item.files.script}', '${item.title}', '${item.id}')" class="flex-1 bg-white/5 py-2.5 rounded-xl text-sm font-medium">Lesen</button>
                ${hasAudio ? `<button onclick="app.player.load('${item.files.audio}', '${item.title}', '${item.id}')" class="flex-1 bg-white/5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">Hören</button>` : ''}
            </div>
        </div>`;
    }
});