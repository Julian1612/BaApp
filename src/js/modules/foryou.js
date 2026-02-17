/* src/js/modules/foryou.js */
const ForYou = {
    activeVideo: null,
    observer: null,

    init: () => {
        const view = document.getElementById('view-foryou');
        if (!view) return;

        // LOOP LOGIK: Wenn am Ende angekommen, springe zum Anfang
        view.addEventListener('scroll', () => {
            if (view.scrollTop + view.clientHeight >= view.scrollHeight - 2) {
                view.scrollTo({
                    top: 0,
                    behavior: 'instant'
                });
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

        // Nutzt die shuffle-Logik aus UI für echtes "wildes" Würfeln
        const shuffled = videos; 
        let html = '';

        shuffled.forEach(item => {
            html += `
            <div class="video-snap-item relative w-full h-full flex items-center justify-center bg-black border-b border-gray-800 shrink-0">
                <video 
                    src="${item.files.video}" 
                    class="h-full w-full object-contain bg-black" 
                    loop 
                    playsinline 
                    preload="metadata"
                    onclick="ForYou.togglePlay(this)">
                </video>
                
                <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent pointer-events-none"></div>
                
                <div class="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
                    ${item.files.script ? `
                    <button onclick="event.stopPropagation(); app.reader.open('${item.files.script}', '${item.title}', '${item.id}')" class="flex flex-col items-center gap-1 group active:scale-90 transition">
                        <div class="w-14 h-14 bg-gray-800/80 backdrop-blur text-white rounded-full flex items-center justify-center shadow-lg">
                            <i class="fas fa-align-left text-xl"></i>
                        </div>
                        <span class="text-[10px] font-medium text-white shadow-black drop-shadow-md">Skript</span>
                    </button>` : ''}
                    
                    ${item.files.audio ? `
                    <button onclick="event.stopPropagation(); app.player.load('${item.files.audio}', '${item.title}', '${item.id}')" class="flex flex-col items-center gap-1 group active:scale-90 transition">
                        <div class="w-14 h-14 bg-gray-800/80 backdrop-blur text-white rounded-full flex items-center justify-center shadow-lg">
                            <i class="fas fa-headphones text-xl"></i>
                        </div>
                        <span class="text-[10px] font-medium text-white shadow-black drop-shadow-md">Hören</span>
                    </button>` : ''}
                </div>

                <div class="absolute left-4 bottom-24 right-20 z-10 text-white pointer-events-none">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="bg-blue-600/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                            ${item.subjectKey === 'itm_grundlagen' ? 'ITM' : 'ORG'}
                        </span>
                        <h3 class="font-bold text-xl drop-shadow-md">${item.title}</h3>
                    </div>
                </div>

                <div class="play-icon absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300">
                    <div class="bg-black/50 p-6 rounded-full backdrop-blur-sm">
                        <i class="fas fa-play text-4xl text-white"></i>
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
                video.play().catch(() => {});
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