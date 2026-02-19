const Reader = {
    converter: new showdown.Converter({
        tables: true, tasklists: true, strikethrough: true,
        simpleLineBreaks: true, emoji: true, headerLevelStart: 1, ghCompatibleHeaderId: true
    }),
    currentId: null, tempQuote: null, noteToDelete: null,

    open: async (url, title, id) => {
        Reader.currentId = id;
        const readerView = document.getElementById('view-reader');
        readerView.innerHTML = Reader._getReaderTemplate(title);
        readerView.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; 

        try {
            const response = await fetch(url);
            const text = await response.text();
            const html = Reader.converter.makeHtml(text);
            const contentDiv = document.getElementById('reader-content');
            contentDiv.innerHTML = Reader._getContentTemplate(html);
            Reader.renderNotes();
            if(id) SpacedRepetition.markAsReviewed(id);
            document.addEventListener('selectionchange', Reader.handleSelection);
        } catch (e) {
            console.error(e);
            document.getElementById('reader-content').innerHTML = '<div class="flex flex-col items-center justify-center h-64 text-gray-500"><i class="fas fa-exclamation-circle text-2xl mb-2"></i><p>Fehler beim Laden.</p></div>';
        }
    },

    close: () => {
        document.getElementById('view-reader').classList.add('hidden');
        document.body.style.overflow = '';
        document.removeEventListener('selectionchange', Reader.handleSelection);
        document.getElementById('selection-tooltip').classList.add('hidden');
    },

    handleSelection: () => {
        const selection = window.getSelection();
        const tooltip = document.getElementById('selection-tooltip');
        if (!document.getElementById('note-modal').classList.contains('hidden') || !document.getElementById('delete-modal').classList.contains('hidden')) {
            tooltip.classList.add('hidden'); return;
        }
        if (selection.isCollapsed || selection.toString().trim().length === 0) {
            tooltip.classList.add('hidden'); return;
        }
        tooltip.classList.remove('hidden');
    },

    closeModal: () => {
        document.getElementById('note-modal').classList.add('hidden');
        document.getElementById('delete-modal').classList.add('hidden');
        Reader.tempQuote = null; Reader.noteToDelete = null;
    },

    _getReaderTemplate: (title) => `
        <div class="sticky top-0 z-50 bg-[#1c1c1e]/95 backdrop-blur-md safe-top px-4 py-3 flex justify-between items-center border-b border-white/10 shadow-sm transition-all">
             <h2 class="text-sm font-bold truncate pr-4 text-white w-3/4">${title}</h2>
             <button onclick="app.reader.close()" class="bg-gray-800 text-gray-400 hover:text-white w-8 h-8 rounded-full flex items-center justify-center transition border border-white/5"><i class="fas fa-times text-sm"></i></button>
        </div>
        <div id="reader-content" class="px-5 pt-6 pb-64 max-w-2xl mx-auto min-h-screen">
            <div class="animate-pulse flex space-x-4"><div class="flex-1 space-y-4 py-1"><div class="h-4 bg-gray-800 rounded w-3/4"></div><div class="h-4 bg-gray-800 rounded"></div><div class="h-4 bg-gray-800 rounded w-5/6"></div></div></div>
        </div>
        <div id="note-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onclick="app.reader.closeModal()"></div>
            <div class="bg-[#1c1c1e] border border-white/10 w-full max-w-sm rounded-3xl shadow-2xl relative z-10 overflow-hidden">
                <div class="p-5">
                    <div class="flex justify-between items-center mb-4"><h3 class="font-bold text-white text-lg">Notiz hinzufügen</h3><button onclick="app.reader.closeModal()" class="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full bg-white/5"><i class="fas fa-times"></i></button></div>
                    <div class="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 mb-4"><div class="flex gap-2"><span class="text-blue-400 text-lg leading-none">❝</span><p id="modal-quote-text" class="text-xs text-blue-200 italic line-clamp-3 leading-relaxed">...</p></div></div>
                    <textarea id="note-input" rows="4" class="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none placeholder-gray-600" placeholder="Deine Gedanken dazu..."></textarea>
                </div>
                <div class="p-5 pt-0 flex gap-3"><button onclick="app.reader.closeModal()" class="flex-1 py-3 rounded-xl text-gray-400 font-medium hover:bg-white/5 transition">Abbrechen</button><button onclick="app.reader.saveNoteFromModal()" class="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition">Speichern</button></div>
            </div>
        </div>
        <div id="delete-modal" class="hidden fixed inset-0 z-[110] flex items-center justify-center px-6">
            <div class="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onclick="app.reader.closeModal()"></div>
            <div class="bg-[#2c2c2e] border border-white/10 w-full max-w-xs rounded-3xl shadow-2xl relative z-10 overflow-hidden text-center p-6">
                <div class="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4"><i class="fas fa-trash-alt text-xl text-red-500"></i></div>
                <h3 class="font-bold text-white text-lg mb-2">Notiz löschen?</h3>
                <p class="text-gray-400 text-sm mb-6 leading-relaxed">Möchtest du diese Notiz wirklich endgültig entfernen?</p>
                <div class="flex gap-3"><button onclick="app.reader.closeModal()" class="flex-1 py-3 rounded-xl text-white font-medium bg-gray-600 hover:bg-gray-500 transition">Abbrechen</button><button onclick="app.reader.executeDelete()" class="flex-1 bg-red-500 text-white hover:bg-red-400 py-3 rounded-xl font-bold shadow-lg shadow-red-900/20 transition">Löschen</button></div>
            </div>
        </div>`,

    _getContentTemplate: (html) => `
        <div class="prose" id="article-text">${html}</div><hr class="my-12 border-white/10">
        <div id="notes-section"><h3 class="font-bold text-white mb-6 flex items-center gap-2 text-xl"><span class="bg-yellow-500/10 text-yellow-500 w-8 h-8 rounded-lg flex items-center justify-center text-sm border border-yellow-500/20"><i class="fas fa-pen"></i></span>Deine Notizen</h3><div id="notes-list" class="space-y-4"></div></div>`
};