const Settings = {
    open: () => {
        document.getElementById('view-settings').classList.remove('hidden');
        document.getElementById('scroll-wrapper').classList.add('hidden');
        document.getElementById('main-header').classList.add('hidden');
        Settings.render(); // Re-render to ensure UI updates
        // Settings.updateDarkModeToggle(); // Removed: Dark Mode functionality
        // Settings.addGoogleSyncListeners(); // Removed: Google Sync functionality
        Settings.updateFontSizeSelection();
        // if (window.app && window.app.googleSync) { // Removed: Google Sync functionality
        //     window.app.googleSync.checkAuthStatus();
        // }
    },

    close: () => {
        document.getElementById('view-settings').classList.add('hidden');
        document.getElementById('scroll-wrapper').classList.remove('hidden');
        document.getElementById('main-header').classList.remove('hidden');
        // Settings.removeGoogleSyncListeners(); // Removed: Google Sync functionality
    },

    render: () => {
        const currentFontSize = localStorage.getItem('fontSize') || 'medium';
        const container = document.getElementById('view-settings');
        container.innerHTML = `
        <div class="h-full flex flex-col bg-black text-white">
            <div class="sticky top-0 z-50 bg-[#1c1c1e]/80 backdrop-blur-xl border-b border-white/10" style="padding-top: max(env(safe-area-inset-top), 20px);">
                <div class="h-14 px-4 flex justify-between items-center">
                    <button onclick="Settings.close()" class="text-blue-500 font-medium text-lg">Fertig</button>
                    <h2 class="text-lg font-bold">Einstellungen</h2>
                    <div class="w-12"></div>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 space-y-8 pb-32">

                <!-- Actions Section -->
                <section>
                    <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-4">Aktionen</h3>
                    <div class="bg-[#1c1c1e] rounded-xl overflow-hidden">
                        <div class="p-4 flex items-center justify-between active:bg-white/5 transition" onclick="window.location.reload()">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center"><i class="fas fa-sync-alt"></i></div>
                                <span class="text-base font-medium">Seite neu laden</span>
                            </div>
                            <i class="fas fa-chevron-right text-gray-600 text-sm"></i>
                        </div>
                    </div>
                </section>

                <!-- Appearance -->
                <section>
                    <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-4">Darstellung</h3>
                    <div class="bg-[#1c1c1e] rounded-xl overflow-hidden">
                        <div class="p-4 flex items-center justify-between active:bg-white/5 transition">
                            <span class="text-base font-medium">Schriftgröße</span>
                            <div class="flex gap-2">
                                <button class="text-sm px-3 py-1 rounded-lg ${currentFontSize === 'small' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300'}" onclick="Settings.setFontSize('small')">Klein</button>
                                <button class="text-sm px-3 py-1 rounded-lg ${currentFontSize === 'medium' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300'}" onclick="Settings.setFontSize('medium')">Mittel</button>
                                <button class="text-sm px-3 py-1 rounded-lg ${currentFontSize === 'large' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300'}" onclick="Settings.setFontSize('large')">Groß</button>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- About -->
                <section>
                    <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-4">Über</h3>
                    <div class="bg-[#1c1c1e] rounded-xl overflow-hidden">
                        <div class="p-4 flex items-center justify-between">
                            <span class="text-base font-medium">Version</span>
                            <span class="text-sm text-gray-500">1.0.0 (Beta)</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
        `;
    },

    // Removed updateDarkModeToggle: () => { ... }
    // Removed toggleDarkMode: () => { ... }

    setFontSize: (size) => {
        document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
        document.documentElement.classList.add(`font-${size}`);
        localStorage.setItem('fontSize', size);
        Settings.render(); // Re-render to update the active button styles
    },

    updateFontSizeSelection: () => {
        const savedFontSize = localStorage.getItem('fontSize') || 'medium';
        document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
        document.documentElement.classList.add(`font-${savedFontSize}`);
    },

    // Removed clearCache: () => { ... }
    // Removed Google Sync UI Handlers
    // Removed addGoogleSyncListeners: () => { ... }
    // Removed removeGoogleSyncListeners: () => { ... }
    // Removed updateGoogleSyncUI: (event) => { ... }
};

window.Settings = Settings;