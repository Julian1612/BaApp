Object.assign(Reader, {
    saveHighlight: () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        if (!text) return;
        Reader.tempQuote = text;
        document.getElementById('modal-quote-text').innerText = text;
        document.getElementById('note-input').value = ''; 
        document.getElementById('note-modal').classList.remove('hidden');
        document.getElementById('selection-tooltip').classList.add('hidden');
        setTimeout(() => document.getElementById('note-input').focus(), 100);
    },

    saveNoteFromModal: () => {
        const noteInput = document.getElementById('note-input');
        const note = noteInput.value.trim();
        const allNotes = JSON.parse(localStorage.getItem('studyNotes')) || {};
        if (!allNotes[Reader.currentId]) allNotes[Reader.currentId] = [];
        allNotes[Reader.currentId].push({ id: Date.now(), quote: Reader.tempQuote, note: note, date: new Date().toISOString() });
        localStorage.setItem('studyNotes', JSON.stringify(allNotes));
        Reader.closeModal();
        Reader.renderNotes();
        window.getSelection().removeAllRanges();
    },

    renderNotes: () => {
        const list = document.getElementById('notes-list');
        if(!list) return;
        const allNotes = JSON.parse(localStorage.getItem('studyNotes')) || {};
        const notes = (allNotes[Reader.currentId] || []).sort((a, b) => b.id - a.id);
        if (notes.length === 0) {
            list.innerHTML = `<div class="text-center py-8 border-2 border-dashed border-white/5 rounded-2xl"><p class="text-gray-500 text-sm">Markiere Text für eine Notiz.</p></div>`;
            return;
        }
        list.innerHTML = notes.map(n => `
            <div class="bg-[#1c1c1e] p-5 rounded-2xl border border-white/5 mb-4 shadow-sm">
                <div class="flex justify-between items-start mb-3">
                    <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">${new Date(n.date).toLocaleDateString('de-DE')}</span>
                    <button onclick="app.reader.deleteNote(${n.id})" class="text-gray-600 hover:text-red-500 transition"><i class="fas fa-trash-alt text-xs"></i></button>
                </div>
                <div class="relative pl-4 mb-3"><div class="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-full"></div><p class="text-gray-400 text-sm italic line-clamp-4">"${n.quote}"</p></div>
                ${n.note ? `<p class="text-gray-200 font-medium text-base mt-2">${n.note}</p>` : ''}
            </div>`).join('');
    },

    deleteNote: (noteId) => {
        Reader.noteToDelete = noteId;
        document.getElementById('delete-modal').classList.remove('hidden');
    },

    executeDelete: () => {
        if (!Reader.noteToDelete) return;
        const allNotes = JSON.parse(localStorage.getItem('studyNotes')) || {};
        if (allNotes[Reader.currentId]) {
            allNotes[Reader.currentId] = allNotes[Reader.currentId].filter(n => n.id !== Reader.noteToDelete);
            localStorage.setItem('studyNotes', JSON.stringify(allNotes));
            Reader.renderNotes();
        }
        Reader.closeModal();
    }
});