// Resolve paths dynamically for subfolders and error pages
const isSubfolder = window.location.pathname.includes('/retro-racer-frontend/') || 
                    window.location.pathname.includes('/cyber-survivor-frontend/') || 
                    window.location.pathname.includes('/dino-frontend/'); // Add others as fallback

const swPath = window.location.pathname.endsWith('/404.html') ? '/sw.js' : (isSubfolder ? '../sw.js' : 'sw.js');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(swPath)
            .then((reg) => console.log('Service Worker registered successfully with scope:', reg.scope))
            .catch((err) => console.warn('Service Worker registration failed:', err));
    });
}

// PWA Installation Trigger Logic
let deferredPrompt;
const installBtn = document.getElementById('pwa-install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI to show the install button
    if (installBtn) {
        installBtn.classList.remove('hidden');
    }
});

if (installBtn) {
    installBtn.addEventListener('click', (e) => {
        // Hide the button
        installBtn.classList.add('hidden');
        // Show the prompt
        if (deferredPrompt) {
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('Player accepted the PWA install prompt');
                } else {
                    console.log('Player dismissed the PWA install prompt');
                    // Re-show the button if they dismissed
                    installBtn.classList.remove('hidden');
                }
                deferredPrompt = null;
            });
        }
    });
}

window.addEventListener('appinstalled', (evt) => {
    console.log('Arcade Hub PWA was installed successfully!');
    if (installBtn) {
        installBtn.classList.add('hidden');
    }
});
