const ForYou = {
    activeVideo: null,
    observer: null,
    currentSpeed: 1.0,
    wakeLock: null, // Referenz für den Wachhalter

    init: () => {
        const view = document.getElementById('view-foryou');
        if (!view) return;

        // Infinite Scroll Loop
        view.addEventListener('scroll', () => {
            if (view.scrollTop + view.clientHeight >= view.scrollHeight - 2) {
                view.scrollTo({ top: 0, behavior: 'instant' });
            }
        });

        // Wake Lock freigeben, wenn Tab gewechselt wird
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && ForYou.activeVideo && !ForYou.activeVideo.paused) {
                ForYou.requestWakeLock();
            } else {
                ForYou.releaseWakeLock();
            }
        });

        const options = { root: view, rootMargin: '0px', threshold: 0.6 };

        if ('IntersectionObserver' in window) {
            ForYou.observer = new IntersectionObserver(ForYou.handleIntersection, options);
        }
    }
};