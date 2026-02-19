Object.assign(UI, {
    switchTab: (tabName) => {
        const header = document.getElementById('main-header');
        const scrollWrapper = document.getElementById('scroll-wrapper');
        const viewForyou = document.getElementById('view-foryou');
        
        document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));

        if (tabName === 'foryou') {
            if(scrollWrapper) scrollWrapper.classList.add('hidden');
            if(viewForyou) {
                viewForyou.classList.remove('hidden');
                viewForyou.scrollTop = 0;
            }
            if(header) header.classList.add('-translate-y-full');
            
            if(window.app && window.app.data) {
                const randomizedData = UI._shuffle(window.app.data);
                window.app.foryou.render(randomizedData);
            }
        } else {
            if(viewForyou) viewForyou.classList.add('hidden');
            if(scrollWrapper) scrollWrapper.classList.remove('hidden');
            if(header) header.classList.remove('-translate-y-full');
            if(window.app && window.app.foryou) window.app.foryou.pauseAll();

            if (tabName === 'dashboard') {
                document.getElementById('view-dashboard').classList.remove('hidden');
                UI.renderDashboard(window.app.data);
                document.getElementById('page-title').innerText = 'Dashboard';
            }
            if (tabName === 'library') {
                document.getElementById('view-library').classList.remove('hidden');
                UI.renderLibrary(window.app.data);
                document.getElementById('page-title').innerText = 'Bibliothek';
            }
        }

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('text-blue-500', 'active', 'text-white');
            btn.classList.add('text-gray-500');
        });
        const activeBtn = document.querySelector(`button[onclick*="${tabName}"]`);
        if(activeBtn) {
            activeBtn.classList.remove('text-gray-500');
            activeBtn.classList.add(tabName === 'foryou' ? 'text-white' : 'text-blue-500', 'active');
        }
    }
});