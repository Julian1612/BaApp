const ForYou = {
    activeVideo: null,
    observer: null,
    currentSpeed: 1.0, // Speichert die Geschwindigkeit global für alle Videos

    init: () => {
        const view = document.getElementById('view-foryou');
        if (!view) return;

        // Infinite Scroll Loop
        view.addEventListener('scroll', () => {
            if (view.scrollTop + view.clientHeight >= view.scrollHeight - 2) {
                view.scrollTo({ top: 0, behavior: 'instant' });
            }
        });

        const options = {
            root: view,
            rootMargin: '0px',
            threshold: 0.6
        };

        if ('IntersectionObserver' in window) {
            ForYou.observer = new IntersectionObserver(ForYou.handleIntersection, options);
        }
    },

    render: (content) => {
        const container = document.getElementById('view-foryou');
        if (!container) return;

        const videos = content.filter(c => c.files && c.files.video);
        
        if (videos.length === 0) {
            container.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-gray-500">
                    <i class="fas fa-video-slash text-4xl mb-4"></i>
                    <p>Keine Videos gefunden.</p>
                </div>`;
            return;
        }

        const shuffled = videos; 
        let html = '';

        shuffled.forEach(item => {
            html += `
            <div class="video-snap-item relative w-full h-full flex items-center justify-center bg-black border-b border-gray-800 shrink-0" data-id="${item.id}">
                <video 
                    src="${item.files.video}" 
                    class="h-full w-full object-contain bg-black" 
                    loop 
                    playsinline 
                    preload="metadata"
                    onclick="ForYou.togglePlay(this)">
                </video>
                
                <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent pointer-events-none"></div>
                
                <div class="absolute right-4 bottom-24 flex flex-col items-center gap-5 z-20">
                    
                    <button onclick="event.stopPropagation(); ForYou.changeSpeed(this)" class="btn-speed flex flex-col items-center gap-1 group active:scale-90 transition">
                        <div class="w-12 h-12 bg-gray-800/80 backdrop-blur text-white rounded-full flex items-center justify-center shadow-lg border border-white/10">
                            <span class="text-xs font-bold speed-label">${ForYou.currentSpeed}x</span>
                        </div>
                        <span class="text-[9px] font-medium text-white shadow-black drop-shadow-md">Tempo</span>
                    </button>

                    ${item.files.script ? `
                    <button onclick="event.stopPropagation(); app.reader.open('${item.files.script}', '${item.title}', '${item.id}')" class="flex flex-col items-center gap-1 group active:scale-90 transition">
                        <div class="w-12 h-12 bg-gray-800/80 backdrop-blur text-white rounded-full flex items-center justify-center shadow-lg border border-white/10">
                            <i class="fas fa-align-left text-lg"></i>
                        </div>
                        <span class="text-[9px] font-medium text-white shadow-black drop-shadow-md">Skript</span>
                    </button>` : ''}
                    
                    ${item.files.audio ? `
                    <button onclick="event.stopPropagation(); app.player.load('${item.files.audio}', '${item.title}', '${item.id}')" class="flex flex-col items-center gap-1 group active:scale-90 transition">
                        <div class="w-12 h-12 bg-gray-800/80 backdrop-blur text-white rounded-full flex items-center justify-center shadow-lg border border-white/10">
                            <i class="fas fa-headphones text-lg"></i>
                        </div>
                        <span class="text-[9px] font-medium text-white shadow-black drop-shadow-md">Hören</span>
                    </button>` : ''}
                </div>

                <div class="absolute left-4 bottom-24 right-20 z-10 text-white pointer-events-none">
                    <div class="flex flex-col gap-1 mb-2">
                        <span class="self-start bg-blue-600/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                            ${item.subjectKey === 'itm_grundlagen' ? 'ITM' : 'ORG'}
                        </span>
                        <h3 class="font-bold text-lg leading-tight drop-shadow-md pr-4">${item.title}</h3>
                    </div>
                </div>

                <div class="play-icon absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300">
                    <div class="bg-black/40 p-5 rounded-full backdrop-blur-sm border border-white/10">
                        <i class="fas fa-play text-3xl text-white ml-1"></i>
                    </div>
                </div>
            </div>`;
        });

        container.innerHTML = html;

        if (ForYou.observer) {
            container.querySelectorAll('.video-snap-item').forEach(el => ForYou.observer.observe(el));
        }
    },

    handleIntersection: (entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            if (!video) return;

            if (entry.isIntersecting) {
                // Setze gespeicherte Geschwindigkeit
                video.playbackRate = ForYou.currentSpeed;
                
                // Aktualisiere das Label des Buttons auf diesem Slide (falls nötig)
                const speedLabel = entry.target.querySelector('.speed-label');
                if(speedLabel) speedLabel.innerText = ForYou.currentSpeed + 'x';

                video.play().catch(() => {});
                ForYou.activeVideo = video;
            } else {
                video.pause();
                video.currentTime = 0;
            }
        });
    },

    changeSpeed: (btnElement) => {
        // Zyklus: 1.0 -> 1.25 -> 1.5 -> 2.0 -> 1.0
        const speeds = [1.0, 1.25, 1.5, 2.0];
        let idx = speeds.indexOf(ForYou.currentSpeed);
        ForYou.currentSpeed = speeds[(idx + 1) % speeds.length];

        // 1. Geschwindigkeit am aktiven Video ändern
        if (ForYou.activeVideo) {
            ForYou.activeVideo.playbackRate = ForYou.currentSpeed;
        }

        // 2. Button Text aktualisieren
        const label = btnElement.querySelector('.speed-label');
        if (label) {
            label.innerText = ForYou.currentSpeed + 'x';
            
            // Kleines visuelles Feedback
            label.parentElement.classList.add('bg-blue-600');
            setTimeout(() => label.parentElement.classList.remove('bg-blue-600'), 200);
        }
    },

    togglePlay: (videoEl) => {
        const parent = videoEl.parentElement;
        const icon = parent.querySelector('.play-icon');
        if (videoEl.paused) {
            videoEl.play();
            icon.classList.add('opacity-0');
            icon.classList.remove('opacity-100');
        } else {
            videoEl.pause();
            icon.classList.add('opacity-100');
            icon.classList.remove('opacity-0');
        }
    },

    pauseAll: () => {
        document.querySelectorAll('video').forEach(v => v.pause());
    }
};