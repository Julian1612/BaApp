const Reader = {
    converter: new showdown.Converter(),
    currentId: null,
    tempQuote: null, // Zwischenspeicher für das Zitat, während das Modal offen ist

    open: async (url, title, id) => {
        Reader.currentId = id;
        
        // UI Setup: Reader + Das neue Modal (standardmäßig versteckt)
        const readerView = document.getElementById('view-reader');
        readerView.innerHTML = `
            <div class="sticky top-0 z-50 glass safe-top px-4 py-3 flex justify-between items-center shadow-sm transition-all">
                 <h2 class="text-sm font-bold truncate pr-4 text-gray-900 w-3/4">${title}</h2>
                 <button onclick="app.reader.close()" class="bg-gray-100 text-gray-600 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center transition">
                    <i class="fas fa-times text-sm"></i>
                 </button>
            </div>
            
            <div id="reader-content" class="px-5 pt-6 pb-40 max-w-2xl mx-auto min-h-screen">
                <div class="animate-pulse flex space-x-4">
                    <div class="flex-1 space-y-4 py-1">
                        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div class="h-4 bg-gray-200 rounded"></div>
                        <div class="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                </div>
            </div>

            <div id="note-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center px-4">
                <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onclick="app.reader.closeModal()"></div>
                
                <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl transform transition-all scale-100 relative z-10 overflow-hidden">
                    <div class="p-5">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-gray-900 text-lg">Notiz hinzufügen</h3>
                            <button onclick="app.reader.closeModal()" class="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50"><i class="fas fa-times"></i></button>
                        </div>
                        
                        <div class="bg-blue-50 p-3 rounded-xl border border-blue-100 mb-4">
                            <div class="flex gap-2">
                                <span class="text-blue-400 text-lg leading-none">❝</span>
                                <p id="modal-quote-text" class="text-xs text-blue-900 italic line-clamp-3 leading-relaxed">...</p>
                            </div>
                        </div>
                        
                        <textarea id="note-input" rows="4" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none placeholder-gray-400" placeholder="Deine Gedanken dazu..."></textarea>
                    </div>
                    
                    <div class="p-5 pt-0 flex gap-3">
                         <button onclick="app.reader.closeModal()" class="flex-1 py-3 rounded-xl text-gray-500 font-medium hover:bg-gray-50 transition">Abbrechen</button>
                         <button onclick="app.reader.saveNoteFromModal()" class="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition">Speichern</button>
                    </div>
                </div>
            </div>
        `;
        
        readerView.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Body Scroll sperren

        try {
            const response = await fetch(url);
            const text = await response.text();
            const html = Reader.converter.makeHtml(text);
            
            const contentDiv = document.getElementById('reader-content');
            contentDiv.innerHTML = `
                <div class="prose prose-lg prose-headings:font-bold prose-p:text-gray-700 prose-a:text-blue-600" id="article-text">
                    ${html}
                </div>
                
                <hr class="my-12 border-gray-200">
                
                <div id="notes-section">
                    <h3 class="font-bold text-gray-900 mb-6 flex items-center gap-2 text-xl">
                        <span class="bg-yellow-100 text-yellow-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm"><i class="fas fa-pen"></i></span>
                        Deine Notizen
                    </h3>
                    <div id="notes-list" class="space-y-4"></div>
                </div>
            `;

            Reader.renderNotes();
            
            if(id) SpacedRepetition.markAsReviewed(id);
            document.addEventListener('selectionchange', Reader.handleSelection);

        } catch (e) {
            console.error(e);
            document.getElementById('reader-content').innerHTML = '<div class="flex flex-col items-center justify-center h-64 text-gray-400"><i class="fas fa-exclamation-circle text-2xl mb-2"></i><p>Fehler beim Laden.</p></div>';
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
        
        // Tooltip verstecken, wenn Modal offen ist oder keine Auswahl
        if (!document.getElementById('note-modal').classList.contains('hidden')) {
            tooltip.classList.add('hidden');
            return;
        }

        if (selection.isCollapsed || selection.toString().trim().length === 0) {
            tooltip.classList.add('hidden');
            return;
        }

        tooltip.classList.remove('hidden');
    },

    // 1. Schritt: Wird vom "Notiz speichern" Button im Tooltip aufgerufen
    saveHighlight: () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (!text) return;

        // Speichere Text temporär
        Reader.tempQuote = text;
        
        // Befülle Modal
        document.getElementById('modal-quote-text').innerText = text;
        document.getElementById('note-input').value = ''; 
        
        // Zeige Modal
        document.getElementById('note-modal').classList.remove('hidden');
        document.getElementById('selection-tooltip').classList.add('hidden'); // Tooltip weg
        
        // Fokus auf Input (kleiner Delay für Animation)
        setTimeout(() => document.getElementById('note-input').focus(), 100);
    },

    // 2. Schritt: Wird vom "Speichern" Button im Modal aufgerufen
    saveNoteFromModal: () => {
        const noteInput = document.getElementById('note-input');
        const note = noteInput.value.trim();
        
        // Wir speichern auch leere Notizen, wenn der User nur das Zitat will, 
        // oder wir erzwingen Text: if (!note) return;

        const allNotes = JSON.parse(localStorage.getItem('studyNotes')) || {};
        if (!allNotes[Reader.currentId]) allNotes[Reader.currentId] = [];

        allNotes[Reader.currentId].push({
            id: Date.now(),
            quote: Reader.tempQuote,
            note: note,
            date: new Date().toISOString()
        });

        localStorage.setItem('studyNotes', JSON.stringify(allNotes));

        Reader.closeModal();
        Reader.renderNotes();
        
        // Auswahl aufheben für sauberen Look
        window.getSelection().removeAllRanges();
    },

    closeModal: () => {
        document.getElementById('note-modal').classList.add('hidden');
        Reader.tempQuote = null;
    },

    renderNotes: () => {
        const list = document.getElementById('notes-list');
        const allNotes = JSON.parse(localStorage.getItem('studyNotes')) || {};
        const notes = allNotes[Reader.currentId] || [];

        // Sortieren: Neueste oben
        notes.sort((a, b) => b.id - a.id);

        if (notes.length === 0) {
            list.innerHTML = `
                <div class="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl">
                    <p class="text-gray-400 text-sm">Markiere Text, um eine Notiz zu erstellen.</p>
                </div>`;
            return;
        }

        list.innerHTML = notes.map(n => `
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
                <div class="flex justify-between items-start mb-3">
                    <span class="text-[10px] font-bold tracking-wider text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded">
                        ${new Date(n.date).toLocaleDateString('de-DE')}
                    </span>
                    <button onclick="app.reader.deleteNote(${n.id})" class="text-gray-300 hover:text-red-500 w-6 h-6 flex items-center justify-center transition">
                        <i class="fas fa-trash-alt text-xs"></i>
                    </button>
                </div>
                
                <div class="relative pl-4 mb-3">
                    <div class="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-full"></div>
                    <p class="text-gray-500 text-sm italic leading-relaxed line-clamp-4">"${n.quote}"</p>
                </div>
                
                ${n.note ? `<p class="text-gray-900 font-medium text-base mt-2">${n.note}</p>` : ''}
            </div>
        `).join('');
    },

    deleteNote: (noteId) => {
        // Native Confirm ist okay für Löschen, oder wir bauen später ein eigenes
        if(!confirm("Möchtest du diese Notiz wirklich löschen?")) return;
        
        const allNotes = JSON.parse(localStorage.getItem('studyNotes')) || {};
        if (allNotes[Reader.currentId]) {
            allNotes[Reader.currentId] = allNotes[Reader.currentId].filter(n => n.id !== noteId);
            localStorage.setItem('studyNotes', JSON.stringify(allNotes));
            Reader.renderNotes();
        }
    }
};