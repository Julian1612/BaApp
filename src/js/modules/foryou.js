const ForYou = {
    activeVideo: null,
    observer: null,

    init: () => {
        const view = document.getElementById('view-foryou');
        if (!view) return;

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

        // Shuffle
        const shuffled = videos.sort(() => 0.5 - Math.random());
        let html = '';

        shuffled.forEach(item => {
            html += `
            <div class="video-snap-item relative w-full h-full flex items-center justify-center bg-black border-b border-gray-800 shrink-0 snap-center">
                <video 
                    src="${item.files.video}" 
                    class="h-full w-full object-cover" 
                    loop 
                    playsinline 
                    preload="metadata"
                    onclick="ForYou.togglePlay(this)">
                </video>
                <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none"></div>
                
                <div class="absolute right-4 bottom-28 flex flex-col items-center gap-6 z-20">
                    ${item.files.script ? `
                    <button onclick="event.stopPropagation(); app.reader.open('${item.files.script}', '${item.title}', '${item.id}')" class="flex flex-col items-center gap-1 group active:scale-90 transition">
                        <div class="w-12 h-12 bg-gray-800/80 backdrop-blur text-white rounded-full flex items-center justify-center shadow-lg group-hover:bg-blue-600 transition">
                            <i class="fas fa-align-left text-lg"></i>
                        </div>
                        <span class="text-[10px] font-medium text-white shadow-black drop-shadow-md">Skript</span>
                    </button>` : ''}
                    
                    ${item.files.audio ? `
                    <button onclick="event.stopPropagation(); app.player.load('${item.files.audio}', '${item.title}', '${item.id}')" class="flex flex-col items-center gap-1 group active:scale-90 transition">
                        <div class="w-12 h-12 bg-gray-800/80 backdrop-blur text-white rounded-full flex items-center justify-center shadow-lg group-hover:bg-green-600 transition">
                            <i class="fas fa-headphones text-lg"></i>
                        </div>
                        <span class="text-[10px] font-medium text-white shadow-black drop-shadow-md">Hören</span>
                    </button>` : ''}
                </div>

                <div class="absolute left-4 bottom-24 right-20 z-10 text-white pointer-events-none">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="bg-white/20 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                            ${item.subjectKey === 'itm_grundlagen' ? 'ITM' : 'ORG'}
                        </span>
                        <h3 class="font-bold text-lg leading-snug drop-shadow-md">${item.title}</h3>
                    </div>
                    <p class="text-xs text-gray-300 opacity-80">
                        Tippe zum Starten/Pausieren.
                    </p>
                </div>

                <div class="play-icon absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300">
                    <i class="fas fa-play text-6xl text-white/50"></i>
                </div>
            </div>`;
        });

        container.innerHTML = html;

        // Observer aktivieren
        if (ForYou.observer) {
            container.querySelectorAll('.video-snap-item').forEach(el => ForYou.observer.observe(el));
        }
    },

    handleIntersection: (entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            if (!video) return;

            if (entry.isIntersecting) {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log("Autoplay verhindert, User-Interaktion nötig.");
                    });
                }
                ForYou.activeVideo = video;
            } else {
                video.pause();
                video.currentTime = 0;
            }
        });
    },

    togglePlay: (videoEl) => {
        const parent = videoEl.parentElement;
        const icon = parent.querySelector('.play-icon');
        
        if (videoEl.paused) {
            videoEl.play();
            icon.classList.remove('opacity-100');
            icon.classList.add('opacity-0');
        } else {
            videoEl.pause();
            icon.classList.remove('opacity-0');
            icon.classList.add('opacity-100');
        }
    },

    pauseAll: () => {
        document.querySelectorAll('video').forEach(v => v.pause());
    }
};