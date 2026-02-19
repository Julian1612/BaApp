Object.assign(ForYou, {
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

        let html = '';
        videos.forEach(item => {
            html += `
            <div class="video-snap-item relative w-full h-full flex items-center justify-center bg-black border-b border-gray-800 shrink-0" data-id="${item.id}">
                <div class="video-time absolute top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-opacity duration-500">
                    <span class="text-[10px] font-medium tracking-widest text-white/40 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full border border-white/5">00:00 / 00:00</span>
                </div>
                <video src="${item.files.video}" class="h-full w-full object-contain bg-black" loop playsinline preload="metadata"
                    onclick="ForYou.handleTap(event, this)" ontimeupdate="ForYou.updateTime(this)"></video>
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
                        <div class="w-12 h-12 bg-gray-800/80 backdrop-blur text-white rounded-full flex items-center justify-center shadow-lg border border-white/10"><i class="fas fa-align-left text-lg"></i></div>
                        <span class="text-[9px] font-medium text-white shadow-black drop-shadow-md">Skript</span>
                    </button>` : ''}
                    ${item.files.audio ? `
                    <button onclick="event.stopPropagation(); app.player.load('${item.files.audio}', '${item.title}', '${item.id}')" class="flex flex-col items-center gap-1 group active:scale-90 transition">
                        <div class="w-12 h-12 bg-gray-800/80 backdrop-blur text-white rounded-full flex items-center justify-center shadow-lg border border-white/10"><i class="fas fa-headphones text-lg"></i></div>
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
                    <div class="bg-black/40 p-5 rounded-full backdrop-blur-sm border border-white/10"><i class="fas fa-play text-3xl text-white ml-1"></i></div>
                </div>
            </div>`;
        });

        container.innerHTML = html;
        if (ForYou.observer) {
            container.querySelectorAll('.video-snap-item').forEach(el => ForYou.observer.observe(el));
        }
    },

    updateTime: (videoEl) => {
        const timeDisplay = videoEl.parentElement.querySelector('.video-time span');
        if (!timeDisplay) return;
        timeDisplay.innerText = `${ForYou.formatTime(videoEl.currentTime)} / ${ForYou.formatTime(videoEl.duration || 0)}`;
    },

    formatTime: (seconds) => {
        if (isNaN(seconds)) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },

    showSkipFeedback: (container, type) => {
        const existing = container.querySelector('.skip-feedback');
        if(existing) existing.remove();
        const el = document.createElement('div');
        const positionClass = type === 'back' ? 'left-1/4' : 'right-1/4';
        el.className = `skip-feedback absolute top-1/2 ${positionClass} -translate-y-1/2 z-30 bg-black/70 backdrop-blur-md w-20 h-20 rounded-full flex flex-col items-center justify-center text-white animate-fade-in pointer-events-none border border-white/10`;
        el.innerHTML = type === 'back' ? '<i class="fas fa-undo text-2xl mb-1"></i><span class="text-xs font-bold">-10s</span>' : '<i class="fas fa-redo text-2xl mb-1"></i><span class="text-xs font-bold">+10s</span>';
        container.appendChild(el);
        setTimeout(() => {
            el.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => el.remove(), 300);
        }, 500);
    }
});