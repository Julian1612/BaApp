const Reader = {
    converter: new showdown.Converter(),
    
    open: async (url, title, id) => {
        app.ui.switchTab('reader'); // Wechselt View aber lässt Tableiste intakt
        const container = document.getElementById('view-reader');
        container.innerHTML = '<div class="animate-pulse">Lade Skript...</div>';
        
        try {
            const response = await fetch(url);
            const text = await response.text();
            const html = Reader.converter.makeHtml(text);
            
            container.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold">${title}</h2>
                    <button onclick="app.ui.switchTab('library')" class="text-blue-600">Schließen</button>
                </div>
                <div class="prose max-w-none text-lg">
                    ${html}
                </div>
            `;
            
            // Tracking
            if(id) SpacedRepetition.markAsReviewed(id);
            
        } catch (e) {
            container.innerHTML = '<p class="text-red-500">Fehler beim Laden.</p>';
        }
    }
};