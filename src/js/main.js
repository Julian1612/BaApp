// WICHTIG: window.app statt const app, damit es global verfügbar ist!
window.app = {
    ui: UI,
    player: Player,
    reader: Reader,
    data: []
};

// Start
document.addEventListener('DOMContentLoaded', async () => {
    Player.init();
    
    try {
        // Cache-Busting für content.json, damit du immer neue Inhalte siehst
        const res = await fetch('content.json?v=' + Date.now());
        window.app.data = await res.json();
        
        UI.renderDashboard(window.app.data);
        UI.renderLibrary(window.app.data);
        
    } catch (e) {
        console.error("Konnte Inhalt nicht laden.", e);
        document.getElementById('view-dashboard').innerHTML = `
            <div class="p-8 text-center">
                <i class="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                <p class="font-bold text-gray-900">Inhalt konnte nicht geladen werden.</p>
                <p class="text-sm text-gray-500 mt-2">Prüfe, ob 'content.json' existiert.</p>
            </div>
        `;
    }
});