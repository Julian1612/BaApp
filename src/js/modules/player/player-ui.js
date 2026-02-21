Object.assign(Player, {
    updateIcon: (isPlaying) => {
        if(!Player.btnPlay) return;
        const icon = Player.btnPlay.querySelector('i');
        if(icon) icon.className = isPlaying ? 'fas fa-pause text-xl ml-0' : 'fas fa-play text-xl ml-1';
    },
    
    updateProgress: () => {
        if(!Player.progressBar || !Player.audio || !Player.audio.duration) return;
        Player.progressBar.style.width = `${(Player.audio.currentTime / Player.audio.duration) * 100}%`;
    },

    updateSpeedUI: () => {
        if(!Player.btnSpeed) return;
        Player.btnSpeed.innerText = Player.currentSpeed + 'x';
        if(Player.currentSpeed !== 1.0) {
            Player.btnSpeed.classList.add('text-blue-500', 'bg-white/10');
            Player.btnSpeed.classList.remove('text-gray-300');
        } else {
            Player.btnSpeed.classList.remove('text-blue-500', 'bg-white/10');
            Player.btnSpeed.classList.add('text-gray-300');
        }
    }
});