const Player = {
    audio: null,
    btnPlay: null,
    btnSpeed: null,
    progressBar: null,
    currentSpeed: 1.0,

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

    // Hier angepasst für größere Icons (text-2xl statt text-sm)
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