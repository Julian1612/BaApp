Object.assign(ForYou, {
    requestWakeLock: async () => {
        try {
            if ('wakeLock' in navigator && !ForYou.wakeLock) {
                ForYou.wakeLock = await navigator.wakeLock.request('screen');
            }
        } catch (err) { console.log('Wake Lock error:', err); }
    },

    releaseWakeLock: async () => {
        if (ForYou.wakeLock) {
            try {
                await ForYou.wakeLock.release();
                ForYou.wakeLock = null;
            } catch (err) { console.log('Wake Lock release error:', err); }
        }
    },

    handleTap: (event, videoEl) => {
        const rect = videoEl.getBoundingClientRect();
        const percentage = (event.clientX - rect.left) / rect.width;
        if (percentage < 0.30) {
            videoEl.currentTime = Math.max(0, videoEl.currentTime - 10);
            ForYou.showSkipFeedback(videoEl.parentElement, 'back');
        } else if (percentage > 0.70) {
            videoEl.currentTime = Math.min(videoEl.duration, videoEl.currentTime + 10);
            ForYou.showSkipFeedback(videoEl.parentElement, 'fwd');
        } else { ForYou.togglePlay(videoEl); }
    },

    handleIntersection: (entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            if (!video) return;
            if (entry.isIntersecting) {
                video.playbackRate = ForYou.currentSpeed;
                const label = entry.target.querySelector('.speed-label');
                if(label) label.innerText = ForYou.currentSpeed + 'x';
                video.play().then(() => ForYou.requestWakeLock()).catch(() => {});
                ForYou.activeVideo = video;
            } else {
                video.pause();
                video.currentTime = 0;
                if (ForYou.activeVideo === video) ForYou.releaseWakeLock();
            }
        });
    },

    changeSpeed: (btnElement) => {
        const speeds = [1.0, 1.25, 1.5, 2.0];
        ForYou.currentSpeed = speeds[(speeds.indexOf(ForYou.currentSpeed) + 1) % speeds.length];
        if (ForYou.activeVideo) ForYou.activeVideo.playbackRate = ForYou.currentSpeed;
        const label = btnElement.querySelector('.speed-label');
        if (label) {
            label.innerText = ForYou.currentSpeed + 'x';
            label.parentElement.classList.add('bg-blue-600');
            setTimeout(() => label.parentElement.classList.remove('bg-blue-600'), 200);
        }
    },

    togglePlay: (videoEl) => {
        const icon = videoEl.parentElement.querySelector('.play-icon');
        if (videoEl.paused) {
            videoEl.play();
            ForYou.requestWakeLock();
            icon.classList.add('opacity-0'); icon.classList.remove('opacity-100');
        } else {
            videoEl.pause();
            ForYou.releaseWakeLock();
            icon.classList.add('opacity-100'); icon.classList.remove('opacity-0');
        }
    },

    pauseAll: () => {
        document.querySelectorAll('video').forEach(v => v.pause());
        ForYou.releaseWakeLock();
    }
});