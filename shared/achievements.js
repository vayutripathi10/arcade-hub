/**
 * Achievement System - Persistent badges for Arcade Hub
 */
class AchievementSystem {
    constructor() {
        this.storageKey = 'arcade_hub_achievements';
        this.achievements = this.load();
        this.createContainer();
    }

    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn('LocalStorage not accessible:', e);
            return {};
        }
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.achievements));
    }

    unlock(game, id, title) {
        const achievementKey = `${game}_${id}`;
        if (this.achievements[achievementKey]) return;

        this.achievements[achievementKey] = {
            title,
            timestamp: new Date().getTime()
        };
        this.save();
        this.notify(title);
    }

    createContainer() {
        if (document.getElementById('achievement-container')) return;
        const container = document.createElement('div');
        container.id = 'achievement-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);

        const style = document.createElement('style');
        style.textContent = `
            .achievement-popup {
                background: rgba(15, 23, 42, 0.95);
                border: 2px solid #00ffcc;
                border-radius: 12px;
                padding: 15px 25px;
                color: #fff;
                display: flex;
                align-items: center;
                gap: 15px;
                box-shadow: 0 0 20px rgba(0, 255, 204, 0.3);
                transform: translateX(120%);
                transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                font-family: 'Outfit', sans-serif;
            }
            .achievement-popup.active {
                transform: translateX(0);
            }
            .achievement-icon {
                font-size: 24px;
                background: rgba(0, 255, 204, 0.1);
                padding: 10px;
                border-radius: 50%;
                border: 1px solid rgba(0, 255, 204, 0.3);
            }
            .achievement-text h4 {
                margin: 0;
                font-size: 14px;
                color: #00ffcc;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .achievement-text p {
                margin: 4px 0 0;
                font-size: 18px;
                font-weight: 700;
            }
        `;
        document.head.appendChild(style);
    }

    notify(title) {
        let container = document.getElementById('achievement-container');
        if (!container) {
            this.createContainer();
            container = document.getElementById('achievement-container');
        }
        if (!container) return;
        
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-text">
                <h4>Achievement Unlocked</h4>
                <p>${title}</p>
            </div>
        `;
        container.appendChild(popup);

        // Play level up sound if available
        if (window.audioFX) window.audioFX.playLevelUp();

        // Animate in
        setTimeout(() => popup.classList.add('active'), 100);

        // Remove after delay
        setTimeout(() => {
            popup.classList.remove('active');
            setTimeout(() => container.removeChild(popup), 1000);
        }, 4000);
    }
}

const achievements = new AchievementSystem();
window.achievements = achievements;
