const Player = {
    audio: null,
    btnPlay: null,
    currentSpeed: 1.0,

    init: () => {
        Player.audio = document.getElementById('audio-element');
        Player.btnPlay = document.getElementById('btn-play-pause');
        
        // Event Listeners
        document.getElementById('btn-play-pause').onclick = Player.togglePlay;
        document.getElementById('btn-skip-back').onclick = () => Player.skip(-10);
        document.getElementById('btn-skip-fwd').onclick = () => Player.skip(10);
        document.getElementById('btn-speed').onclick = Player.cycleSpeed;
    },

    load: (url, title, id) => {
        document.getElementById('mini-player').classList.remove('hidden');
        document.getElementById('player-title').innerText = title;
        Player.audio.src = url;
        Player.audio.play();
        Player.updateIcon(true);
        
        // Tracking für Spaced Repetition
        if(id) SpacedRepetition.markAsReviewed(id);
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
        const icon = Player.btnPlay.querySelector('i');
        icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    },

    skip: (seconds) => {
        Player.audio.currentTime += seconds;
    },

    cycleSpeed: () => {
        const speeds = [1.0, 1.25, 1.5, 2.0];
        let idx = speeds.indexOf(Player.currentSpeed);
        Player.currentSpeed = speeds[(idx + 1) % speeds.length];
        Player.audio.playbackRate = Player.currentSpeed;
        document.getElementById('btn-speed').innerText = Player.currentSpeed + 'x';
    }
};