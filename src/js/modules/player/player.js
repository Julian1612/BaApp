const Player = {
    audio: null, btnPlay: null, btnSpeed: null, progressBar: null, currentSpeed: 1.0,

    init: () => {
        let audio = document.getElementById('audio-element') || document.createElement('audio');
        if (!audio.id) { audio.id = 'audio-element'; document.body.appendChild(audio); }
        Player.audio = audio;
        Player.btnPlay = document.getElementById('btn-play-pause');
        Player.btnSpeed = document.getElementById('btn-speed');
        Player.progressBar = document.getElementById('progress-bar');
        
        if(Player.btnPlay) Player.btnPlay.onclick = Player.togglePlay;
        if(Player.btnSpeed) Player.btnSpeed.onclick = Player.cycleSpeed;
        ['btn-skip-back', 'btn-skip-fwd'].forEach(id => {
            const btn = document.getElementById(id);
            if(btn) btn.onclick = () => Player.skip(id.includes('back') ? -10 : 10);
        });
        
        Player.audio.ontimeupdate = Player.updateProgress;
        Player.audio.onended = () => Player.updateIcon(false);
        Player.audio.ondurationchange = Player.updateProgress; // Update duration when metadata loads
    },

    close: () => {
        if(Player.audio) Player.audio.pause();
        Player.updateIcon(false);
        const playerEl = document.getElementById('mini-player');
        if(playerEl) {
            playerEl.classList.add('translate-y-full'); 
            setTimeout(() => playerEl.classList.add('hidden'), 300);
        }
    },

    load: (url, title, id) => {
        const titleEl = document.getElementById('player-title');
        if(titleEl) titleEl.innerText = title;
        Player.audio.src = url;
        Player.audio.playbackRate = Player.currentSpeed;
        Player.updateSpeedUI();
        Player.audio.play().then(() => {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({ title, artist: "Study App", artwork: [{ src: 'public/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] });
                navigator.mediaSession.setActionHandler('play', Player.togglePlay);
                navigator.mediaSession.setActionHandler('pause', Player.togglePlay);
                navigator.mediaSession.setActionHandler('seekbackward', () => Player.skip(-10));
                navigator.mediaSession.setActionHandler('seekforward', () => Player.skip(10));
            }
        }).catch(e => console.error("Playback failed:", e));
        Player.updateIcon(true);
        const playerEl = document.getElementById('mini-player');
        if(playerEl) {
            playerEl.classList.remove('hidden');
            requestAnimationFrame(() => playerEl.classList.remove('translate-y-full'));
        }
        if(id && typeof SpacedRepetition !== 'undefined') SpacedRepetition.markAsReviewed(id);
    },

    togglePlay: () => {
        if (Player.audio.paused) { Player.audio.play(); Player.updateIcon(true); }
        else { Player.audio.pause(); Player.updateIcon(false); }
    },

    skip: (seconds) => { if(Player.audio) Player.audio.currentTime += seconds; },
    
    cycleSpeed: () => {
        const speeds = [1.0, 1.25, 1.5, 2.0];
        Player.currentSpeed = speeds[(speeds.indexOf(Player.currentSpeed) + 1) % speeds.length];
        if(Player.audio) Player.audio.playbackRate = Player.currentSpeed;
        Player.updateSpeedUI();
    }
};