/**
 * Achievement System - Persistent badges for Arcade Hub
 */
class AchievementSystem {
    constructor() {
        this.storageKey = 'arcade_hub_achievements';
        this.achievements = this.load();
        this.migrate(); // Handle legacy IDs
        this.createContainer();
    }

    migrate() {
        const mappings = {
            'dino_rookie': 'dino_100',
            'dino_runner': 'dino_500',
            'dino_pro': 'dino_1000',
            'snake_nibbler': 'snake_10',
            'snake_long': 'snake_25', // Score 100
            'snake_master': 'snake_50' // Score 200
        };

        let changed = false;
        for (const [oldKey, newKey] of Object.entries(mappings)) {
            if (this.achievements[oldKey] && !this.achievements[newKey]) {
                this.achievements[newKey] = this.achievements[oldKey];
                delete this.achievements[oldKey];
                changed = true;
            }
        }
        if (changed) this.save();
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

    // New: Definitions for the gallery
    getDefinitions() {
        return [
            { id: 'dino_100', game: 'dino', title: 'Survivor I', desc: 'Score 100 points in Zen Dino', icon: '🦖' },
            { id: 'dino_500', game: 'dino', title: 'Survivor II', desc: 'Score 500 points in Zen Dino', icon: '🏃' },
            { id: 'dino_1000', game: 'dino', title: 'Jurassic Master', desc: 'Score 1000 points in Zen Dino', icon: '🌌' },
            { id: 'snake_10', game: 'snake', title: 'Hungry Snake', desc: 'Eat 10 neon bits', icon: '🐍' },
            { id: 'snake_25', game: 'snake', title: 'Neon Predator', desc: 'Eat 25 neon bits', icon: '🔥' },
            { id: 'snake_50', game: 'snake', title: 'Zen Dragon', desc: 'Eat 50 neon bits', icon: '🐉' },
            { id: 'tictactoe_win', game: 'tictactoe', title: 'Tactician', desc: 'Win a game of Tic Tac Toe', icon: '❌' },
            { id: 'flappy_5',  game: 'flappy', title: 'First Flight',  desc: 'Pass 5 pipes in Neon Flappy',  icon: '🐦' },
            { id: 'flappy_10', game: 'flappy', title: 'Sky Surfer',    desc: 'Pass 10 pipes in Neon Flappy', icon: '🌤️' },
            { id: 'flappy_25', game: 'flappy', title: 'Neon Aviator',  desc: 'Pass 25 pipes in Neon Flappy', icon: '✈️' },
            { id: 'brawler_10', game: 'brawler', title: 'Street Fighter', desc: 'Reach a streak of 10 in Neon Brawler', icon: '🥊' },
            { id: 'brawler_50', game: 'brawler', title: 'Combo Master', desc: 'Reach a streak of 50 in Neon Brawler', icon: '🔥' },
            { id: 'brawler_100', game: 'brawler', title: 'Neon Ninja', desc: 'Reach a streak of 100 in Neon Brawler', icon: '🥷' },
            { id: 'runner_neon_runner_first_run', game: 'runner', title: 'First Run', desc: 'Complete your first run in Neon Runner', icon: '👟' },
            { id: 'runner_neon_runner_score_100', game: 'runner', title: 'Speedster', desc: 'Score 100 points in Neon Runner', icon: '⚡' },
            { id: 'runner_neon_runner_score_500', game: 'runner', title: 'Street Racer', desc: 'Score 500 points in Neon Runner', icon: '🏎️' },
            { id: 'runner_neon_runner_score_1000', game: 'runner', title: 'Neon Legend', desc: 'Score 1000 points in Neon Runner', icon: '👑' },
            { id: 'runner_neon_runner_collect_50_coins', game: 'runner', title: 'Coin Hoarder', desc: 'Collect 50 total coins in Neon Runner', icon: '💰' },
            { id: 'space_first_kill', game: 'space', title: 'First Blood', desc: 'Destroy your first alien ship', icon: '🚀' },
            { id: 'space_score_100', game: 'space', title: 'Cadet', desc: 'Score 100 points in Space Shooter', icon: '🏅' },
            { id: 'space_score_500', game: 'space', title: 'Ace Pilot', desc: 'Score 500 points in Space Shooter', icon: '🎖️' },
            { id: 'space_score_1000', game: 'space', title: 'Galaxy Legend', desc: 'Score 1000 points in Space Shooter', icon: '🌌' },
            { id: 'space_kill_tank', game: 'space', title: 'Tank Buster', desc: 'Destroy a heavy Tank Alien', icon: '💥' }
        ];
    }

    getAllWithStatus() {
        const definitions = this.getDefinitions();
        return definitions.map(def => ({
            ...def,
            unlocked: !!this.achievements[def.id]
        }));
    }
}

const achievements = new AchievementSystem();
window.achievements = achievements;
