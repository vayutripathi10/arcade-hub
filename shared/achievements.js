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
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.achievements));
        } catch (e) {
            console.warn('Achievement save failed (Storage full or blocked):', e);
        }
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
            { id: 'space_kill_tank', game: 'space', title: 'Tank Buster', desc: 'Destroy a heavy Tank Alien', icon: '💥' },
            { id: 'bottle_1st', game: 'bottle', title: 'First Smash', desc: 'Destroy your first bottle', icon: '🍾' },
            { id: 'bottle_combo_10', game: 'bottle', title: 'Combo King', desc: 'Get a 10 combo streak', icon: '🔥' },
            { id: 'bottle_sharp_90', game: 'bottle', title: 'Sharp Shooter', desc: 'Achieve 90%+ accuracy in a match', icon: '🎯' },
            { id: 'bottle_destroy_500', game: 'bottle', title: 'Bottle Hunter', desc: 'Destroy 500 total bottles', icon: '🔫' },
            { id: 'bottle_destroy_1000', game: 'bottle', title: 'Demolition Expert', desc: 'Destroy 1000 total bottles', icon: '💥' },
            { id: 'bottle_gold_50', game: 'bottle', title: 'Gold Rush', desc: 'Destroy 50 gold bottles', icon: '🥇' },
            { id: 'bottle_ice_25', game: 'bottle', title: 'Ice Breaker', desc: 'Destroy 25 ice bottles', icon: '🧊' },
            { id: 'bottle_no_bombs', game: 'bottle', title: 'Untouchable', desc: 'Complete a round without shooting a bomb', icon: '🚫' },
            { id: 'bottle_reload_20', game: 'bottle', title: 'Reload Master', desc: 'Reload perfectly 20 times', icon: '🔄' },
            { id: 'bottle_boss_1', game: 'bottle', title: 'Boss Breaker', desc: 'Defeat your first boss round', icon: '👹' },
            { id: 'bottle_score_legend', game: 'bottle', title: 'Neon Legend', desc: 'Reach 10,000 points in a round', icon: '👑' },
            // Stick Duel Towers
            { id: 'stickduel_first_headshot', game: 'stickduel', title: 'First Headshot', desc: 'Land your first headshot in Stick Duel', icon: '🎯' },
            { id: 'stickduel_perfect_aim', game: 'stickduel', title: 'Perfect Aim', desc: 'Win with 100% headshot accuracy (3+ shots)', icon: '🏹' },
            { id: 'stickduel_long_distance', game: 'stickduel', title: 'Long Distance Kill', desc: 'Land a headshot from 350+ pixels away', icon: '🔭' },
            { id: 'stickduel_unstoppable', game: 'stickduel', title: 'Unstoppable', desc: 'Win 5 rounds in Endless Challenge mode', icon: '💪' },
            { id: 'stickduel_tournament_winner', game: 'stickduel', title: 'Tournament Winner', desc: 'Win a Tournament (3/5 matches)', icon: '🏆' },
            { id: 'stickduel_headshot_master', game: 'stickduel', title: 'Headshot Master', desc: 'Land 5 headshots in a single session', icon: '💀' },
            { id: 'stickduel_survival_expert', game: 'stickduel', title: 'Survival Expert', desc: 'Win 10 rounds in Endless Challenge mode', icon: '🛡️' }
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
