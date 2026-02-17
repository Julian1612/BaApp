Object.assign(window.Player, {
    togglePlay: () => { if (Player.audio.paused) { Player.audio.play(); Player.updateIcon(true); } else { Player.audio.pause(); Player.updateIcon(false); } },
    updateIcon: (isPlaying) => {
        const btn = document.getElementById('btn-play-pause');
        if(btn) btn.querySelector('i').className = isPlaying ? 'fas fa-pause text-sm' : 'fas fa-play text-sm ml-0.5';
    },
    skip: (seconds) => { Player.audio.currentTime += seconds; },
    updateProgress: () => { 
        const pb = document.getElementById('progress-bar');
        if(pb && Player.audio.duration) pb.style.width = `${(Player.audio.currentTime / Player.audio.duration) * 100}%`;
    },
    cycleSpeed: () => {
        const speeds = [1.0, 1.25, 1.5, 2.0];
        Player.currentSpeed = speeds[(speeds.indexOf(Player.currentSpeed) + 1) % speeds.length];
        Player.audio.playbackRate = Player.currentSpeed; Player.updateSpeedUI();
    },
    updateSpeedUI: () => {
        const btn = document.getElementById('btn-speed');
        if(btn) btn.innerText = Player.currentSpeed + 'x';
    },
    close: () => { Player.audio.pause(); document.getElementById('mini-player')?.classList.add('translate-y-full'); }
});