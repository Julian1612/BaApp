Object.assign(Player, {
    updateIcon: (isPlaying) => {
        if(!Player.btnPlay) return;
        const icon = Player.btnPlay.querySelector('i');
        if(icon) icon.className = isPlaying ? 'fas fa-pause text-xl ml-0' : 'fas fa-play text-xl ml-1';
    },
    
    updateProgress: () => {
        if(!Player.progressBar || !Player.audio || !Player.audio.duration) return;

        const currentTime = Player.audio.currentTime;
        const duration = Player.audio.duration;
        const remainingTime = duration - currentTime;

        document.getElementById('player-current-time').innerText = Player._formatTime(currentTime);
        document.getElementById('player-duration').innerText = Player._formatTime(duration);
        
        Player.progressBar.style.width = `${(currentTime / duration) * 100}%`;
    },

    updateSpeedUI: () => {
        if(!Player.btnSpeed) return;
        Player.btnSpeed.innerText = Player.currentSpeed + 'x';
        if(Player.currentSpeed !== 1.0) {
            Player.btnSpeed.classList.add('text-blue-500');
            Player.btnSpeed.classList.remove('text-gray-300');
        } else {
            Player.btnSpeed.classList.remove('text-blue-500');
            Player.btnSpeed.classList.add('text-gray-300');
        }
    },

    _formatTime: (seconds) => {
        if (isNaN(seconds) || seconds < 0) return "00:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');
        return `${formattedMinutes}:${formattedSeconds}`;
    }
});