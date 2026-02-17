const Player = {
    audio: null,
    btnPlay: null,
    btnSpeed: null,
    progressBar: null,
    currentSpeed: 1.0,
    
    // Variablen für Gesten-Steuerung
    lastTapTime: 0,
    longPressTimer: null,
    isLongPressing: false,

    init: () => {
        let audio = document.getElementById('audio-element');
        if (!audio) {
            audio = document.createElement('audio');
            audio.id = 'audio-element';
            document.body.appendChild(audio);
        }
        Player.audio = audio;
        Player.btnPlay = document.getElementById('btn-play-pause');
        Player.btnSpeed = document.getElementById('btn-speed');
        Player.progressBar = document.getElementById('progress-bar');
        
        if(Player.btnPlay) Player.btnPlay.onclick = Player.togglePlay;
        if(Player.btnSpeed) Player.btnSpeed.onclick = Player.cycleSpeed;
        
        const btnBack = document.getElementById('btn-skip-back');
        if(btnBack) btnBack.onclick = () => Player.skip(-10);
        
        const btnFwd = document.getElementById('btn-skip-fwd');
        if(btnFwd) btnFwd.onclick = () => Player.skip(10);
        
        Player.audio.ontimeupdate = Player.updateProgress;
        Player.audio.onended = () => Player.updateIcon(false);

        // Gesten initialisieren
        Player.setupGestures();
    },

    // Neue Funktion für Touch-Gesten
    setupGestures: () => {
        const touchZone = document.body;

        touchZone.addEventListener('touchstart', (e) => {
            // Ignoriere Klicks auf Buttons, Inputs oder Links
            if(e.target.closest('button, a, input, textarea, .no-gestures')) return;

            const touchX = e.touches[0].clientX;
            const width = window.innerWidth;
            const isLeft = touchX < width / 2;

            // Logik: Links gedrückt halten für 2x Speed
            if (isLeft) {
                Player.longPressTimer = setTimeout(() => {
                    Player.isLongPressing = true;
                    Player.audio.playbackRate = 2.0;
                    // Optional: Hier könnte man ein visuelles Feedback einblenden
                }, 500); // Nach 500ms gedrückt halten aktivieren
            }
        }, { passive: true });

        touchZone.addEventListener('touchend', (e) => {
            // Timer stoppen, falls Finger vor 500ms gehoben wird
            clearTimeout(Player.longPressTimer);

            // Ignoriere Klicks auf Buttons
            if(e.target.closest('button, a, input, textarea, .no-gestures')) return;

            // Wenn Longpress aktiv war: Zurücksetzen und abbrechen
            if (Player.isLongPressing) {
                Player.isLongPressing = false;
                Player.audio.playbackRate = Player.currentSpeed; // Zurück zur eingestellten Speed
                return; 
            }

            // Doppel-Tap Logik
            const currentTime = new Date().getTime();
            const tapLength = currentTime - Player.lastTapTime;
            const touchX = e.changedTouches[0].clientX;
            const width = window.innerWidth;

            if (tapLength < 300 && tapLength > 0) {
                // Doppel-Tap erkannt
                if (touchX < width / 2) {
                    Player.skip(-10); // Links: Zurück
                    Player.showGestureFeedback('back');
                } else {
                    Player.skip(10);  // Rechts: Vor
                    Player.showGestureFeedback('forward');
                }
                // Verhindert Standard-Zoom bei Doppel-Tap
                e.preventDefault(); 
            }
            Player.lastTapTime = currentTime;
        });
    },

    // Kleines visuelles Feedback (optional, aber gut für UX)
    showGestureFeedback: (type) => {
        // Erstellt kurz ein Overlay Icon
        const iconClass = type === 'back' ? 'fa-undo-alt' : 'fa-redo-alt';
        const sideClass = type === 'back' ? 'left-10' : 'right-10';
        
        const el = document.createElement('div');
        el.className = `fixed top-1/2 ${sideClass} transform -translate-y-1/2 z-[100] bg-black/70 text-white w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-md animate-ping`;
        el.innerHTML = `<i class="fas ${iconClass} text-3xl"></i><span class="absolute text-xs font-bold mt-8">10s</span>`;
        
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 500);
    },

    close: () => {
        Player.audio.pause();
        Player.updateIcon(false);
        const playerEl = document.getElementById('mini-player');
        
        playerEl.classList.add('translate-y-full'); 
        setTimeout(() => {
            playerEl.classList.add('hidden');
        }, 300);
    },

    load: (url, title, id) => {
        const playerEl = document.getElementById('mini-player');
        const titleEl = document.getElementById('player-title');
        
        if(titleEl) titleEl.innerText = title;
        
        Player.audio.src = url;
        Player.audio.playbackRate = Player.currentSpeed;
        Player.updateSpeedUI();

        Player.audio.play()
            .then(() => {
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: title,
                        artist: "Study App",
                        artwork: [{ src: 'public/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
                    });
                    navigator.mediaSession.setActionHandler('play', Player.togglePlay);
                    navigator.mediaSession.setActionHandler('pause', Player.togglePlay);
                    navigator.mediaSession.setActionHandler('seekbackward', () => Player.skip(-10));
                    navigator.mediaSession.setActionHandler('seekforward', () => Player.skip(10));
                }
            })
            .catch(e => console.error("Playback failed:", e));

        Player.updateIcon(true);
        
        if(playerEl) {
            playerEl.classList.remove('hidden');
            requestAnimationFrame(() => {
                playerEl.classList.remove('translate-y-full');
            });
        }
        
        if(id && typeof SpacedRepetition !== 'undefined') {
            SpacedRepetition.markAsReviewed(id);
            if(app && app.ui && app.ui.gamification) {
                app.ui.gamification.addXP(5);
            }
        }
    },

    togglePlay: () => {
        if (Player.audio.paused) {
            Player.audio.play();
            Player.updateIcon(true);
        } else {
            Player.audio.pause();
            Player.updateIcon(false);
        }
    },

    updateIcon: (isPlaying) => {
        if(!Player.btnPlay) return;
        const icon = Player.btnPlay.querySelector('i');
        if(icon) {
            icon.className = isPlaying ? 'fas fa-pause text-2xl ml-0' : 'fas fa-play text-2xl ml-1';
        }
    },

    skip: (seconds) => {
        Player.audio.currentTime += seconds;
    },
    
    updateProgress: () => {
        if(!Player.progressBar || !Player.audio.duration) return;
        const percent = (Player.audio.currentTime / Player.audio.duration) * 100;
        Player.progressBar.style.width = `${percent}%`;
    },
    
    cycleSpeed: () => {
        const speeds = [1.0, 1.25, 1.5, 2.0];
        let idx = speeds.indexOf(Player.currentSpeed);
        Player.currentSpeed = speeds[(idx + 1) % speeds.length];
        Player.audio.playbackRate = Player.currentSpeed;
        Player.updateSpeedUI();
    },

    updateSpeedUI: () => {
        if(Player.btnSpeed) {
            Player.btnSpeed.innerText = Player.currentSpeed + 'x';
            if(Player.currentSpeed !== 1.0) {
                Player.btnSpeed.classList.add('text-blue-500', 'bg-white/20');
                Player.btnSpeed.classList.remove('text-gray-300');
            } else {
                Player.btnSpeed.classList.remove('text-blue-500', 'bg-white/20');
                Player.btnSpeed.classList.add('text-gray-300');
            }
        }
    }
};