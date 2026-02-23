Object.assign(ForYou, {
    render: async (content) => {
        const container = document.getElementById('view-foryou');
        if (!container) return;

        container.innerHTML = '<div class="h-full flex items-center justify-center"><i class="fas fa-spinner fa-spin text-4xl text-gray-500"></i></div>';

        const videoPool = content.filter(c => c.files && c.files.video);
        const cardTopicPool = content.filter(c => !c.files.video && c.files.script); // Assuming these have flashcards
        
        // Resolve all individual cards for the feed
        let cardPool = [];
        for (const topic of cardTopicPool.slice(0, 15)) {
            const url = `content/${topic.subjectKey}/flashcards/${topic.id}.csv`;
            try {
                const res = await fetch(url);
                if (res.ok) {
                    const text = await res.text();
                    const deck = Flashcards.parseCSV(text, topic.id);
                    deck.forEach((c, i) => cardPool.push({ item: topic, card: c, index: i }));
                }
            } catch (e) {}
        }
        
        // Shuffle pools
        UI._shuffle(videoPool);
        UI._shuffle(cardPool);

        // SEQUENCER: 2-5 Cards -> 1-2 Videos
        const feedItems = [];
        let vIdx = 0;
        let cIdx = 0;

        while (cIdx < cardPool.length || vIdx < videoPool.length) {
            // Add 2-5 cards
            const cCount = Math.floor(Math.random() * 4) + 2; 
            for (let i = 0; i < cCount && cIdx < cardPool.length; i++) {
                feedItems.push({ type: 'card', ...cardPool[cIdx++] });
            }
            // Add 1-2 videos
            const vCount = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < vCount && vIdx < videoPool.length; i++) {
                feedItems.push({ type: 'video', data: videoPool[vIdx++] });
            }
        }

        if (feedItems.length === 0) {
            container.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-gray-500"><p>Keine Inhalte.</p></div>`;
            return;
        }

        let html = '';
        feedItems.forEach((entry, idx) => {
            if (entry.type === 'video') {
                const item = entry.data;
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
                        ${item.files.script ? `<button onclick="event.stopPropagation(); app.reader.open('${item.files.script}', '${item.title.replace(/'/g, "\\'")}', '${item.id}')" class="flex flex-col items-center gap-1 group active:scale-90 transition"><div class="w-12 h-12 bg-gray-800/80 backdrop-blur text-white rounded-full flex items-center justify-center shadow-lg border border-white/10"><i class="fas fa-align-left text-lg"></i></div><span class="text-[9px] font-medium text-white shadow-black drop-shadow-md">Skript</span></button>` : ''}
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
            } else {
                // FLASHCARD
                const item = entry.item;
                const card = entry.card;
                const cardElId = `feed-card-${idx}`;
                
                const hints = `
                <div class="hints-wrapper mt-4" onclick="event.stopPropagation()">
                  ${card.Hinweis_1 ? `<details class="hint-card"><summary><span class="status-dot"></span>Tipp 01</summary><div class="hint-content">${card.Hinweis_1}</div></details>` : ''}
                  ${card.Hinweis_2 ? `<details class="hint-card"><summary><span class="status-dot"></span>Tipp 02</summary><div class="hint-content">${card.Hinweis_2}</div></details>` : ''}
                </div>`;

                const frontContent = `
                    <div class="card-container h-full flex flex-col">
                        <div class="header-nav">
                            <div class="course-pill-wrapper"><div class="course-pill">${item.subjectKey === 'itm_grundlagen' ? 'ITM' : 'ORG'}</div></div>
                            <div class="topic-dimmed truncate">${item.title}</div>
                        </div>
                        <div class="content-focus flex-1 flex flex-col justify-center">
                            <div class="question-text text-center">${card.Frage}</div>
                            ${hints}
                        </div>
                        <div class="mt-auto pt-4 text-center">
                            <span class="text-[10px] text-blue-400 font-bold uppercase tracking-widest animate-pulse">Tippen für Antwort</span>
                        </div>
                    </div>`;

                const backContent = `
                    <div class="card-container active-state h-full flex flex-col">
                        <div class="header-nav dimmed">
                            <div class="course-pill-wrapper"><div class="course-pill">${item.subjectKey === 'itm_grundlagen' ? 'ITM' : 'ORG'}</div></div>
                            <div class="topic-dimmed truncate">${item.title}</div>
                        </div>
                        <div class="content-focus spotlight-effect flex-1 overflow-y-auto">
                            <div class="question-ref text-[10px] text-gray-500 mb-2">${card.Frage}</div>
                            <div class="answer-main text-base leading-relaxed">${card.Antwort}</div>
                        </div>
                        <div class="footer-area mt-4 pt-4 border-t border-white/5 text-center">
                            <span class="text-[10px] text-gray-500 uppercase tracking-widest">Nächste Karte</span>
                        </div>
                    </div>`;

                html += `
                <div class="video-snap-item relative w-full h-full flex flex-col items-center justify-center bg-black border-b border-gray-800 shrink-0 snap-center p-4" onclick="ForYou.flipCard('${cardElId}')">
                    <div id="${cardElId}" class="w-full max-w-md aspect-[3/4.5] perspective-1000 group cursor-pointer">
                        <div class="relative preserve-3d transition-transform duration-500 ease-out-back w-full h-full">
                            <div class="absolute inset-0 backface-hidden bg-[#1c1c1e] rounded-[22px] shadow-2xl overflow-hidden border border-white/10">
                                ${frontContent}
                            </div>
                            <div class="absolute inset-0 backface-hidden rotate-y-180 bg-[#1c1c1e] rounded-[22px] shadow-2xl overflow-hidden border border-blue-500/30">
                                ${backContent}
                            </div>
                        </div>
                    </div>
                </div>`;
            }
        });

        container.innerHTML = html;
        if (ForYou.observer) {
            container.querySelectorAll('.video-snap-item').forEach(el => ForYou.observer.observe(el));
        }
    },

    flipCard: (id) => {
        const wrapper = document.getElementById(id);
        if (wrapper) {
            const inner = wrapper.querySelector('.preserve-3d');
            const currentRotation = inner.style.transform;
            inner.style.transform = currentRotation === 'rotateY(180deg)' ? 'rotateY(0deg)' : 'rotateY(180deg)';
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