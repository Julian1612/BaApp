const Reader = {
    converter: new showdown.Converter(),
    currentId: null,

    open: async (url, title, id) => {
        Reader.currentId = id;
        
        // UI Setup
        const readerView = document.getElementById('view-reader');
        readerView.innerHTML = `
            <div class="sticky top-0 z-50 bg-[#1c1c1e]/90 backdrop-blur-md safe-top px-4 py-3 flex justify-between items-center border-b border-white/10">
                 <h2 class="text-sm font-bold truncate pr-4 text-white w-3/4">${title}</h2>
                 <button onclick="app.reader.close()" class="bg-gray-800 text-gray-400 hover:text-white w-8 h-8 rounded-full flex items-center justify-center transition">
                    <i class="fas fa-times text-sm"></i>
                 </button>
            </div>
            <div id="reader-content" class="px-5 pt-6 pb-32 max-w-2xl mx-auto">
                <div class="animate-pulse flex space-x-4">
                    <div class="flex-1 space-y-4 py-1">
                        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div class="h-4 bg-gray-200 rounded"></div>
                        <div class="h-4 bg-gray-200 rounded w-5/6"></div>
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
            
            // Render Content + Notizen Bereich
            const contentDiv = document.getElementById('reader-content');
            contentDiv.innerHTML = `
                <div class="prose prose-lg" id="article-text">
                    ${html}
                </div>
                <hr class="my-10 border-gray-200">
                <div id="notes-section">
                    <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <i class="fas fa-pen-nib text-blue-500"></i> Deine Notizen
                    </h3>
                    <div id="notes-list" class="space-y-4"></div>
                </div>
            `;

            // Lade existierende Notizen
            Reader.renderNotes();
            
            // Tracking start
            SpacedRepetition.markAsReviewed(id);

            // Selection Event Listener hinzufügen
            document.addEventListener('selectionchange', Reader.handleSelection);

        } catch (e) {
            console.error(e);
            document.getElementById('reader-content').innerHTML = '<p class="text-red-500 text-center mt-10">Konnte Inhalt nicht laden.</p>';
        }
    },

    close: () => {
        document.getElementById('view-reader').classList.add('hidden');
        document.body.style.overflow = ''; // Scroll freigeben
        document.removeEventListener('selectionchange', Reader.handleSelection);
        // Tooltip verstecken falls offen
        document.getElementById('selection-tooltip').classList.add('hidden');
    },

    handleSelection: () => {
        const selection = window.getSelection();
        const tooltip = document.getElementById('selection-tooltip');
        
        // Wenn keine Textauswahl oder Auswahl leer ist
        if (selection.isCollapsed || selection.toString().trim().length === 0) {
            tooltip.classList.add('hidden');
            return;
        }

        // Tooltip anzeigen
        tooltip.classList.remove('hidden');
    },

    saveHighlight: () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (!text) return;

        const note = prompt("Möchtest du eine Notiz dazu schreiben?");
        if (note === null) return; // Abbrechen

        // Speichern
        const allNotes = JSON.parse(localStorage.getItem('studyNotes')) || {};
        if (!allNotes[Reader.currentId]) allNotes[Reader.currentId] = [];

        allNotes[Reader.currentId].push({
            id: Date.now(),
            quote: text,
            note: note,
            date: new Date().toISOString()
        });

        localStorage.setItem('studyNotes', JSON.stringify(allNotes));

        // UI Feedback & Reset
        selection.removeAllRanges();
        document.getElementById('selection-tooltip').classList.add('hidden');
        Reader.renderNotes();
    },

    renderNotes: () => {
        const list = document.getElementById('notes-list');
        const allNotes = JSON.parse(localStorage.getItem('studyNotes')) || {};
        const notes = allNotes[Reader.currentId] || [];

        if (notes.length === 0) {
            list.innerHTML = '<p class="text-gray-400 text-sm italic">Markiere Text um Notizen hinzuzufügen.</p>';
            return;
        }

        list.innerHTML = notes.map(n => `
            <div class="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs text-yellow-600 font-bold uppercase">Notiz</span>
                    <button onclick="app.reader.deleteNote(${n.id})" class="text-gray-400 hover:text-red-500"><i class="fas fa-trash"></i></button>
                </div>
                <blockquote class="text-gray-600 text-sm border-l-2 border-yellow-300 pl-2 mb-2 italic">
                    "${n.quote.substring(0, 100)}${n.quote.length > 100 ? '...' : ''}"
                </blockquote>
                <p class="text-gray-900 font-medium">${n.note || ''}</p>
            </div>
        `).join('');
    },

    deleteNote: (noteId) => {
        if(!confirm("Notiz löschen?")) return;
        
        const allNotes = JSON.parse(localStorage.getItem('studyNotes')) || {};
        if (allNotes[Reader.currentId]) {
            allNotes[Reader.currentId] = allNotes[Reader.currentId].filter(n => n.id !== noteId);
            localStorage.setItem('studyNotes', JSON.stringify(allNotes));
            Reader.renderNotes();
        }
    }
};