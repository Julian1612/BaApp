const Reader = {
    converter: new showdown.Converter({
        tables: true, tasklists: true, strikethrough: true,
        simpleLineBreaks: true, emoji: true, headerLevelStart: 1, ghCompatibleHeaderId: true
    }),
    currentId: null,
    editMode: false,
    currentDraft: '',
    noteToDelete: null,

    open: async (url, title, id) => {
        Reader.currentId = id;
        Reader.editMode = false;
        Reader.currentDraft = '';
        
        const item = window.app.data.find(i => i.id === id);
        const audioUrl = item && item.files ? item.files.audio : null;

        const readerView = document.getElementById('view-reader');
        readerView.innerHTML = Reader._getTemplate(title, audioUrl, id);
        readerView.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        document.addEventListener('selectionchange', Reader.handleSelectionChange);

        try {
            const res = await fetch(url);
            const text = await res.text();
            
            // Generate HTML
            let html = Reader.converter.makeHtml(text);
            
            // Post-process to wrap tables for horizontal scrolling
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            tempDiv.querySelectorAll('table').forEach(table => {
                const wrapper = document.createElement('div');
                wrapper.className = 'overflow-x-auto my-6 border border-white/10 rounded-xl bg-[#1c1c1e]';
                table.style.margin = '0'; // Remove default margin from table
                table.style.border = 'none'; // Remove default border from table
                table.style.borderRadius = '0'; 
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            });
            
            document.getElementById('reader-content').innerHTML = tempDiv.innerHTML;
            
            Reader.renderNotes();
            if(id && window.SpacedRepetition) SpacedRepetition.markAsReviewed(id);
        } catch (e) {
            document.getElementById('reader-content').innerHTML = '<p class="text-center py-10 text-gray-500">Inhalt konnte nicht geladen werden.</p>';
        }
    },

    close: () => {
        document.getElementById('view-reader').classList.add('hidden');
        document.body.style.overflow = '';
        Reader.editMode = false;
        document.removeEventListener('selectionchange', Reader.handleSelectionChange);
    },

    handleSelectionChange: () => {
        if (!Reader.editMode) return;
        const selection = window.getSelection().toString().trim();
        const btn = document.getElementById('save-note-btn');
        const btnText = document.getElementById('save-note-text');
        if (selection.length > 0) {
            Reader.currentDraft = selection;
            if (btn) {
                btn.classList.remove('opacity-50', 'bg-gray-800', 'text-gray-400');
                btn.classList.add('bg-white', 'text-black', 'shadow-lg');
                btnText.innerText = 'Markierung speichern';
            }
        }
    },

    toggleEdit: () => {
        Reader.editMode = !Reader.editMode;
        const btn = document.getElementById('reader-edit-btn');
        const footer = document.getElementById('reader-footer');
        if (Reader.editMode) {
            btn.classList.add('text-yellow-500', 'bg-yellow-500/10');
            footer.classList.remove('hidden');
            Reader.currentDraft = '';
            Reader.updateSaveButtonState(false);
        } else {
            btn.classList.remove('text-yellow-500', 'bg-yellow-500/10');
            footer.classList.add('hidden');
        }
    },

    updateSaveButtonState: (isActive) => {
        const btn = document.getElementById('save-note-btn');
        const btnText = document.getElementById('save-note-text');
        if (!btn) return;
        if (isActive) {
            btn.classList.remove('opacity-50', 'bg-gray-800', 'text-gray-400');
            btn.classList.add('bg-white', 'text-black', 'shadow-lg');
            btnText.innerText = 'Markierung speichern';
        } else {
            btn.classList.add('opacity-50', 'bg-gray-800', 'text-gray-400');
            btn.classList.remove('bg-white', 'text-black', 'shadow-lg');
            btnText.innerText = 'Bitte Text markieren...';
        }
    },

    _getTemplate: (title, audioUrl, id) => `
        <div class="sticky top-0 z-[110] bg-[#1c1c1e] border-b border-white/10 shadow-lg" style="padding-top: max(env(safe-area-inset-top), 20px);">
            <div class="h-14 px-4 flex justify-between items-center gap-3">
                <button onclick="Reader.close()" class="w-10 h-10 flex items-center justify-center text-gray-400 active:text-white transition"><i class="fas fa-chevron-left text-lg"></i></button>
                <h2 class="text-sm font-bold truncate text-white flex-1 text-center">${title}</h2>
                <div class="flex gap-2">
                    ${audioUrl ? `
                    <button onclick="app.player.load('${audioUrl}', '${title.replace(/'/g, "\\'")}', '${id}')" class="w-10 h-10 flex items-center justify-center text-blue-400 rounded-full transition active:bg-white/10">
                        <i class="fas fa-headphones text-lg"></i>
                    </button>` : ''}
                    <button id="reader-edit-btn" onclick="Reader.toggleEdit()" class="w-10 h-10 flex items-center justify-center text-gray-400 rounded-full transition active:bg-white/10">
                        <i class="fas fa-pen-nib text-lg"></i>
                    </button>
                </div>
            </div>
        </div>
        <div id="reader-content" class="prose max-w-2xl mx-auto px-5 pt-8 pb-40 min-h-screen"></div>
        <div id="notes-section" class="max-w-2xl mx-auto px-5 pb-48"><h3 class="text-white font-bold text-xl mb-6 border-b border-white/10 pb-2">Deine Notizen</h3><div id="notes-list" class="space-y-4"></div></div>
        <div id="reader-footer" class="hidden fixed bottom-0 left-0 right-0 z-[120] bg-[#1c1c1e] border-t border-white/10 p-4 safe-bottom backdrop-blur-xl shadow-2xl" style="padding-bottom: max(env(safe-area-inset-bottom), 30px);">
            <button id="save-note-btn" onclick="Reader.openNoteInput()" class="w-full bg-gray-800 text-gray-400 opacity-50 font-bold py-4 rounded-xl transition flex items-center justify-center gap-2"><i class="fas fa-highlighter"></i><span id="save-note-text">Bitte Text markieren...</span></button>
        </div>
        <div id="input-modal" class="hidden fixed inset-0 z-[150] flex items-center justify-center px-4">
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="Reader.closeModals()"></div>
            <div class="bg-[#2c2c2e] border border-white/10 w-full max-w-sm rounded-3xl shadow-2xl relative z-10 p-5">
                <h3 class="font-bold text-white text-lg mb-4">Notiz hinzufügen</h3>
                <div class="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 mb-4"><p id="input-modal-quote" class="text-xs text-blue-200 italic line-clamp-3">...</p></div>
                <textarea id="input-modal-text" rows="3" class="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white mb-4 transition focus:border-blue-500 focus:outline-none" placeholder="Gedanken..."></textarea>
                <div class="flex gap-3"><button onclick="Reader.closeModals()" class="flex-1 py-3 rounded-xl text-gray-400 bg-white/5">Abbrechen</button><button onclick="Reader.saveNoteConfirmed()" class="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">Speichern</button></div>
            </div>
        </div>
        <div id="delete-modal" class="hidden fixed inset-0 z-[160] flex items-center justify-center px-6">
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="Reader.closeModals()"></div>
            <div class="bg-[#2c2c2e] border border-white/10 w-full max-w-xs rounded-3xl shadow-2xl relative z-10 p-6 text-center">
                <div class="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4"><i class="fas fa-trash-alt text-red-500"></i></div>
                <h3 class="text-white font-bold text-lg mb-2">Notiz löschen?</h3>
                <p class="text-gray-400 text-sm mb-6">Diese Aktion kann nicht rückgängig gemacht werden.</p>
                <div class="flex gap-3"><button onclick="Reader.closeModals()" class="flex-1 py-3 rounded-xl bg-white/5 text-gray-400">Abbrechen</button><button onclick="Reader.confirmDelete()" class="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold">Löschen</button></div>
            </div>
        </div>
    `,

    openNoteInput: () => {
        let selection = Reader.currentDraft || window.getSelection().toString().trim();
        if (!selection) {
            const btn = document.getElementById('save-note-btn');
            btn.classList.add('animate-bounce'); setTimeout(() => btn.classList.remove('animate-bounce'), 500); return;
        }
        document.getElementById('input-modal-quote').innerText = selection;
        document.getElementById('input-modal-text').value = '';
        document.getElementById('input-modal').classList.remove('hidden');
        setTimeout(() => document.getElementById('input-modal-text').focus(), 100);
    },

    closeModals: () => {
        document.getElementById('input-modal').classList.add('hidden');
        document.getElementById('delete-modal').classList.add('hidden');
        Reader.noteToDelete = null;
    },

    saveNoteConfirmed: () => {
        const selection = document.getElementById('input-modal-quote').innerText;
        const note = document.getElementById('input-modal-text').value.trim();
        const allNotes = JSON.parse(localStorage.getItem('studyNotes')) || {};
        if (!allNotes[Reader.currentId]) allNotes[Reader.currentId] = [];
        allNotes[Reader.currentId].push({ id: Date.now(), quote: selection, note: note, date: new Date().toISOString() });
        localStorage.setItem('studyNotes', JSON.stringify(allNotes));
        Reader.renderNotes();
        window.getSelection().removeAllRanges();
        Reader.currentDraft = ''; Reader.updateSaveButtonState(false); Reader.closeModals(); Reader.toggleEdit(); 
    },

    renderNotes: () => {
        const list = document.getElementById('notes-list');
        if (!list) return;
        const allNotes = JSON.parse(localStorage.getItem('studyNotes')) || {};
        const notes = (allNotes[Reader.currentId] || []).sort((a, b) => b.id - a.id);
        if (notes.length === 0) { list.innerHTML = '<p class="text-gray-500 text-sm italic py-4 text-center">Noch keine Notizen.</p>'; return; }
        list.innerHTML = notes.map(n => `
            <div class="bg-[#2c2c2e] p-4 rounded-xl border border-white/5 relative group">
                <button onclick="Reader.deleteNote(${n.id})" class="absolute top-2 right-2 p-2 text-gray-500 hover:text-red-500"><i class="fas fa-trash-alt text-sm"></i></button>
                <div class="pl-3 border-l-2 border-yellow-500/50 mb-2 pr-8"><p class="text-gray-300 text-xs italic line-clamp-3">"${n.quote}"</p></div>
                ${n.note ? `<p class="text-white text-sm font-medium mt-1">${n.note}</p>` : ''}
                <span class="text-[10px] text-gray-600 mt-2 block">${new Date(n.date).toLocaleDateString()}</span>
            </div>`).join('');
    },

    deleteNote: (id) => {
        Reader.noteToDelete = id;
        document.getElementById('delete-modal').classList.remove('hidden');
    },

    confirmDelete: () => {
        if (!Reader.noteToDelete) return;
        const allNotes = JSON.parse(localStorage.getItem('studyNotes')) || {};
        if (allNotes[Reader.currentId]) {
            allNotes[Reader.currentId] = allNotes[Reader.currentId].filter(n => n.id !== Reader.noteToDelete);
            localStorage.setItem('studyNotes', JSON.stringify(allNotes));
            Reader.renderNotes();
        }
        Reader.closeModals();
    }
};
window.Reader = Reader;