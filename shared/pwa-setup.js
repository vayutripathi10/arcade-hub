// Resolve paths dynamically for subfolders and error pages
const isSubfolder = window.location.pathname.includes('/retro-racer-frontend/') || 
                    window.location.pathname.includes('/cyber-survivor-frontend/') || 
                    window.location.pathname.includes('/dino-frontend/') ||
                    window.location.pathname.includes('/blog/');

const swPath = window.location.pathname.endsWith('/404.html') ? '/sw.js' : (isSubfolder ? '../sw.js' : 'sw.js');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(swPath)
            .then((reg) => console.log('Service Worker registered successfully with scope:', reg.scope))
            .catch((err) => console.warn('Service Worker registration failed:', err));
    });
}

// Check iOS and stand-alone states
const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
const isiOSChrome = navigator.userAgent.includes('CriOS');

// PWA Installation Trigger Logic
let deferredPrompt;
const installBtn = document.getElementById('pwa-install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI to show the install button for non-iOS devices
    if (installBtn && !isiOS) {
        installBtn.classList.remove('hidden');
    }
});

// If the player is on iOS and not yet running in standalone mode, reveal the Install App button!
if (isiOS && !isStandalone) {
    if (installBtn) {
        installBtn.classList.remove('hidden');
    }
}

if (installBtn) {
    installBtn.addEventListener('click', (e) => {
        if (isiOS) {
            // Trigger iOS instruction modal instead of browser prompt
            showIOSInstallModal();
            return;
        }

        // Standard dynamic prompt for compatible browsers (Android / Desktop)
        installBtn.classList.add('hidden');
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('Player accepted the PWA install prompt');
                } else {
                    console.log('Player dismissed the PWA install prompt');
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

// High-quality dark-neon overlay modal for iPhone instructions
function showIOSInstallModal() {
    let modal = document.getElementById('ios-install-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ios-install-modal';
        
        // CSS Style Injections
        modal.style.position = 'fixed';
        modal.style.inset = '0';
        modal.style.zIndex = '99999';
        modal.style.background = 'rgba(0, 0, 0, 0.85)';
        modal.style.backdropFilter = 'blur(10px)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.padding = '20px';
        modal.style.fontFamily = "'Outfit', sans-serif";
        modal.style.color = '#fff';
        
        const modalContent = document.createElement('div');
        modalContent.style.background = 'rgba(15, 23, 42, 0.95)';
        modalContent.style.border = '2px solid #00ffcc';
        modalContent.style.boxShadow = '0 0 25px rgba(0, 255, 204, 0.4)';
        modalContent.style.borderRadius = '24px';
        modalContent.style.padding = '30px';
        modalContent.style.maxWidth = '420px';
        modalContent.style.width = '100%';
        modalContent.style.textAlign = 'center';
        modalContent.style.position = 'relative';
        
        // Close Button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '15px';
        closeBtn.style.right = '15px';
        closeBtn.style.background = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = '#888';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => modal.style.display = 'none';
        modalContent.appendChild(closeBtn);
        
        // Title
        const title = document.createElement('h3');
        title.innerHTML = '📲 Install Arcade Hub';
        title.style.color = '#00ffcc';
        title.style.fontSize = '1.6rem';
        title.style.marginBottom = '15px';
        title.style.textTransform = 'uppercase';
        title.style.letterSpacing = '1px';
        modalContent.appendChild(title);
        
        // Instructions container
        const instructions = document.createElement('div');
        instructions.style.textAlign = 'left';
        instructions.style.fontSize = '1.05rem';
        instructions.style.lineHeight = '1.6';
        
        if (isiOSChrome) {
            instructions.innerHTML = `
                <p style="margin-bottom: 15px; color: #ffd700; text-align: center; font-weight: bold; font-size: 1.1rem; border: 1px solid #ffd700; padding: 8px; border-radius: 8px; background: rgba(255, 215, 0, 0.05);">
                    ⚠️ iOS Chrome Restriction
                </p>
                <p style="margin-bottom: 12px; font-weight: 500;">
                    Apple restricts programmatic home-screen installs to the <b>Safari</b> browser on iOS.
                </p>
                <ol style="padding-left: 20px; margin-bottom: 15px;">
                    <li style="margin-bottom: 8px;"><b>Copy</b> this site URL.</li>
                    <li style="margin-bottom: 8px;">Open Apple <b>Safari</b> browser.</li>
                    <li style="margin-bottom: 8px;"><b>Paste</b> the URL and load the site.</li>
                    <li style="margin-bottom: 8px;">Tap the <b>Share icon (📤)</b> and select <b>"Add to Home Screen"</b>.</li>
                </ol>
            `;
        } else {
            instructions.innerHTML = `
                <p style="margin-bottom: 15px; text-align: center;">
                    Add Arcade Hub to your iPhone Home Screen for standalone fullscreen gameplay!
                </p>
                <ol style="padding-left: 20px; margin-bottom: 15px;">
                    <li style="margin-bottom: 8px;">Tap the <b>Share icon (📤)</b> in Safari's bottom toolbar.</li>
                    <li style="margin-bottom: 8px;">Scroll down the menu and tap <b>"Add to Home Screen"</b>.</li>
                    <li style="margin-bottom: 8px;">Tap <b>"Add"</b> in the top right to complete installation.</li>
                </ol>
            `;
        }
        modalContent.appendChild(instructions);
        
        // Close overlay button
        const gotItBtn = document.createElement('button');
        gotItBtn.innerHTML = 'GOT IT';
        gotItBtn.style.width = '100%';
        gotItBtn.style.padding = '12px';
        gotItBtn.style.background = '#00ffcc';
        gotItBtn.style.color = '#000';
        gotItBtn.style.border = 'none';
        gotItBtn.style.borderRadius = '12px';
        gotItBtn.style.fontWeight = '700';
        gotItBtn.style.fontSize = '1.1rem';
        gotItBtn.style.cursor = 'pointer';
        gotItBtn.style.marginTop = '15px';
        gotItBtn.onclick = () => modal.style.display = 'none';
        modalContent.appendChild(gotItBtn);
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    } else {
        // Just refresh text dynamically in case user switched browsers
        const instructions = modal.querySelector('ol').parentElement;
        if (isiOSChrome) {
            instructions.innerHTML = `
                <p style="margin-bottom: 15px; color: #ffd700; text-align: center; font-weight: bold; font-size: 1.1rem; border: 1px solid #ffd700; padding: 8px; border-radius: 8px; background: rgba(255, 215, 0, 0.05);">
                    ⚠️ iOS Chrome Restriction
                </p>
                <p style="margin-bottom: 12px; font-weight: 500;">
                    Apple restricts programmatic home-screen installs to the <b>Safari</b> browser on iOS.
                </p>
                <ol style="padding-left: 20px; margin-bottom: 15px;">
                    <li style="margin-bottom: 8px;"><b>Copy</b> this site URL.</li>
                    <li style="margin-bottom: 8px;">Open Apple <b>Safari</b> browser.</li>
                    <li style="margin-bottom: 8px;"><b>Paste</b> the URL and load the site.</li>
                    <li style="margin-bottom: 8px;">Tap the <b>Share icon (📤)</b> and select <b>"Add to Home Screen"</b>.</li>
                </ol>
            `;
        } else {
            instructions.innerHTML = `
                <p style="margin-bottom: 15px; text-align: center;">
                    Add Arcade Hub to your iPhone Home Screen for standalone fullscreen gameplay!
                </p>
                <ol style="padding-left: 20px; margin-bottom: 15px;">
                    <li style="margin-bottom: 8px;">Tap the <b>Share icon (📤)</b> in Safari's bottom toolbar.</li>
                    <li style="margin-bottom: 8px;">Scroll down the menu and tap <b>"Add to Home Screen"</b>.</li>
                    <li style="margin-bottom: 8px;">Tap <b>"Add"</b> in the top right to complete installation.</li>
                </ol>
            `;
        }
        modal.style.display = 'flex';
    }
}
