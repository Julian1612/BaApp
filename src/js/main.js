const app = {
    ui: UI,
    player: Player,
    reader: Reader,
    data: []
};

// Start
document.addEventListener('DOMContentLoaded', async () => {
    Player.init();
    
    try {
        // Lade die content.json, die vom Build-Skript erstellt wurde
        const res = await fetch('content.json');
        app.data = await res.json();
        
        UI.renderDashboard(app.data);
        UI.renderLibrary(app.data);
        
    } catch (e) {
        console.error("Konnte Inhalt nicht laden. Hast du 'npm run build' ausgeführt?", e);
        document.getElementById('view-dashboard').innerHTML = `
            <div class="p-4 text-center">
                <p class="text-red-500 font-bold">Keine Inhalte gefunden.</p>
                <p class="text-sm text-gray-600 mt-2">Bitte lade Dateien in den content Ordner und führe das Build-Skript aus.</p>
            </div>
        `;
    }
});