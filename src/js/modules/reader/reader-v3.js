const Reader = {
    converter: new showdown.Converter({
        tables: true, tasklists: true, strikethrough: true,
        simpleLineBreaks: true, emoji: true, headerLevelStart: 1, ghCompatibleHeaderId: true
    }),
    currentId: null, tempQuote: null, noteToDelete: null,

    isMobile: () => window.matchMedia('(pointer: coarse)').matches,

    open: async (url, title, id) => {
        Reader.currentId = id;
        const readerView = document.getElementById('view-reader');
        readerView.innerHTML = Reader._getReaderTemplate(title);
        readerView.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; 

        try {
            const res = await fetch(url + '?t=' + Date.now());
            const text = await res.text();
            document.getElementById('reader-content').innerHTML = Reader._getContentTemplate(Reader.converter.makeHtml(text));
            if(Reader.renderNotes) Reader.renderNotes();
            if(id && window.SpacedRepetition) SpacedRepetition.markAsReviewed(id);
        } catch (e) {
            document.getElementById('reader-content').innerHTML = '<div class="h-64 flex items-center justify-center text-gray-500"><p>Fehler beim Laden.</p></div>';
        }
    },

    close: () => {
        document.getElementById('view-reader').classList.add('hidden');
        document.body.style.overflow = '';
    },

    closeModal: () => {
        document.getElementById('note-modal').classList.add('hidden');
        document.getElementById('delete-modal').classList.add('hidden');
        Reader.tempQuote = null; Reader.noteToDelete = null;
    },

    _getReaderTemplate: (title) => {
        const isMobile = Reader.isMobile();
        
        if (!isMobile) {
            // DESKTOP
            return `
            <div class="sticky top-0 z-50 bg-[#1c1c1e]/95 backdrop-blur-md border-b border-white/10 shadow-sm px-6 py-4 flex justify-between items-center">
                 <h2 class="text-lg font-bold truncate text-white flex-1 pr-4">${title}</h2>
                 <div class="flex gap-3">
                     <button onmousedown="event.preventDefault(); app.reader.saveHighlight()" class="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 border border-yellow-500/20">
                        <i class="fas fa-highlighter"></i> Notiz
                     </button>
                     <button onclick="app.reader.close()" class="bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-full flex items-center justify-center transition border border-white/10">
                        <i class="fas fa-times"></i>
                     </button>
                 </div>
            </div>
            <div id="reader-content" class="px-12 pt-10 pb-32 max-w-4xl mx-auto min-h-screen">
                <div class="animate-pulse space-y-4"><div class="h-4 bg-gray-800 rounded w-3/4"></div><div class="h-4 bg-gray-800 rounded"></div></div>
            </div>
            ${Reader._getModalsTemplate()}`;
        }

        // MOBILE
        // Added generous padding-top for Notch
        return `
        <div class="sticky top-0 z-50 bg-[#1c1c1e]/95 backdrop-blur-md border-b border-white/10 shadow-sm" style="padding-top: max(env(safe-area-inset-top), 44px); padding-bottom: 1rem;">
             <div class="px-4 flex justify-center items-center h-8 relative">
                 <h2 class="text-sm font-bold truncate text-white w-3/4 text-center leading-none">${title}</h2>
             </div>
        </div>
        <div id="reader-content" class="px-5 pt-6 pb-32 max-w-2xl mx-auto min-h-screen">
            <div class="animate-pulse space-y-4"><div class="h-4 bg-gray-800 rounded w-3/4"></div><div class="h-4 bg-gray-800 rounded"></div></div>
        </div>
        <div class="fixed bottom-0 left-0 right-0 z-50 bg-[#1c1c1e] border-t border-white/10 pb-safe">
            <div class="flex justify-around items-center h-16 max-w-xl mx-auto px-4 pb-[env(safe-area-inset-bottom)]">
                <button onmousedown="event.preventDefault(); app.reader.saveHighlight()" ontouchstart="event.preventDefault(); app.reader.saveHighlight()" class="flex-1 py-3 text-yellow-500 font-medium active:bg-white/5 rounded-lg transition flex flex-col items-center gap-1">
                    <i class="fas fa-highlighter text-lg"></i><span class="text-[10px]">Notiz</span>
                </button>
                <div class="w-px h-8 bg-white/10"></div>
                <button onclick="app.reader.close()" class="flex-1 py-3 text-white font-medium active:bg-white/5 rounded-lg transition flex flex-col items-center gap-1">
                    <i class="fas fa-times text-lg"></i><span class="text-[10px]">Schließen</span>
                </button>
            </div>
        </div>
        ${Reader._getModalsTemplate()}`;
    },

    _getContentTemplate: (html) => `<div class="prose" id="article-text">${html}</div><hr class="my-12 border-white/10"><div id="notes-section"><h3 class="font-bold text-white mb-6 text-xl">Deine Notizen</h3><div id="notes-list" class="space-y-4"></div></div>`,

    _getModalsTemplate: () => `
        <div id="note-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="app.reader.closeModal()"></div>
            <div class="bg-[#1c1c1e] border border-white/10 w-full max-w-sm rounded-3xl shadow-2xl relative z-10 p-5">
                <h3 class="font-bold text-white text-lg mb-4">Notiz hinzufügen</h3>
                <div class="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 mb-4"><p id="modal-quote-text" class="text-xs text-blue-200 italic line-clamp-3">...</p></div>
                <textarea id="note-input" rows="4" class="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white mb-4" placeholder="Gedanken..."></textarea>
                <div class="flex gap-3"><button onclick="app.reader.closeModal()" class="flex-1 py-3 rounded-xl text-gray-400 bg-white/5">Abbrechen</button><button onclick="app.reader.saveNoteFromModal()" class="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">Speichern</button></div>
            </div>
        </div>
        <div id="delete-modal" class="hidden fixed inset-0 z-[110] flex items-center justify-center px-6">
            <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="app.reader.closeModal()"></div>
            <div class="bg-[#2c2c2e] border border-white/10 w-full max-w-xs rounded-3xl shadow-2xl relative z-10 p-6 text-center">
                <p class="text-white text-lg font-bold mb-4">Notiz löschen?</p>
                <div class="flex gap-3"><button onclick="app.reader.closeModal()" class="flex-1 py-3 rounded-xl bg-gray-600 text-white">Abbrechen</button><button onclick="app.reader.executeDelete()" class="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold">Löschen</button></div>
            </div>
        </div>`
};
window.Reader = Reader;
console.log('Reader V3.2 (Safe Area Fix) Loaded');