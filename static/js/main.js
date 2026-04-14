const TREE_STAGES = ['🌱', '🌿', '🌳', '🪴', '🌸', '✨'];

const FORTUNES = [
    "You don't need motivation. You need a small enough first step.",
    "Your brain isn't broken — it's a Ferrari with bicycle brakes.",
    "Done is better than perfect. Ship it.",
    "You've survived 100% of your worst days.",
    "The task you're avoiding? It's probably a 5-minute task.",
    "Drink water. Seriously. Right now.",
    "You're not lazy. You're overwhelmed. Pick ONE thing.",
    "Progress isn't linear. Neither are you.",
    "The best time to start was yesterday. The second best is now.",
    "Imposter syndrome means you're growing. Beginners don't get it.",
    "Your value isn't measured by your productivity.",
    "Small steps still cover distance.",
    "You don't need to feel ready to begin.",
    "Rest is productive. Burnout is not.",
    "The hardest part is the first 30 seconds.",
    "Your past self would be proud of where you are.",
    "Consistency > Intensity. Always.",
    "You're allowed to do things badly while you learn.",
    "One ritual completed = proof that you can.",
    "The streak isn't sacred. Your wellbeing is.",
    "ADHD time blindness is real. Set a timer, not an alarm.",
    "Your brain loves novelty. Use it. Rotate your rituals.",
    "Guilt doesn't motivate. Curiosity does.",
    "You remembered to open this app. That IS the first step.",
    "Hyperfocus is a superpower when aimed at the right target.",
    "Stop optimizing. Start doing.",
    "You're not behind. You're on your own timeline.",
    "Momentum beats motivation every single time.",
    "The 2-minute rule: if it takes less than 2 min, do it NOW.",
    "Your brain craves dopamine. Give it healthy hits. 🍅"
];

const ACHIEVEMENTS = [
    { id: 'first_ritual', icon: '🌟', name: 'First Spark', desc: 'Complete your first ritual', check: d => d.evidence.length >= 1 },
    { id: 'five_rituals', icon: '🔥', name: 'Flame Keeper', desc: 'Complete 5 rituals', check: d => d.evidence.length >= 5 },
    { id: 'ten_rituals', icon: '💎', name: 'Diamond Hands', desc: 'Complete 10 rituals', check: d => d.evidence.length >= 10 },
    { id: 'tree_stage_2', icon: '🌿', name: 'Green Thumb', desc: 'Grow tree to Stage 2', check: d => d.treeStage >= 1 },
    { id: 'tree_stage_4', icon: '🌳', name: 'Forest Guardian', desc: 'Grow tree to Stage 4', check: d => d.treeStage >= 3 },
    { id: 'focus_50', icon: '🎯', name: 'Sharp Shooter', desc: 'Earn 50 Focus', check: d => d.focusPoints >= 50 },
    { id: 'focus_200', icon: '🏆', name: 'Focus Master', desc: 'Earn 200 Focus', check: d => d.focusPoints >= 200 },
    { id: 'essence_25', icon: '✨', name: 'Essence Collector', desc: 'Earn 25 Essence', check: d => d.essence >= 25 },
    { id: 'pomodoro_1', icon: '🍅', name: 'Tomato Timer', desc: 'Complete 1 Pomodoro', check: () => (parseInt(localStorage.getItem('hf-pomo-count')) || 0) >= 1 },
    { id: 'pomodoro_5', icon: '🍅🍅', name: 'Tomato Farm', desc: 'Complete 5 Pomodoros', check: () => (parseInt(localStorage.getItem('hf-pomo-count')) || 0) >= 5 },
];

class HabitForge {
    constructor() {
        this.data = {
            essence: 0,
            treeProgress: 0,
            treeStage: 0,
            energyLevel: 100,
            focusPoints: 0,
            habits: [],
            todos: [],
            quests: [],
            rewards: []
        };
        this.exercisePresets = [];
        this.kineticsMode = 'daily';
        this.kinetics3D = null;
        this.missionTimer = null;
        this.missionTimeRemaining = 0;
        this.currentMissionIndex = parseInt(localStorage.getItem('hf-kinetics-level')) || 0;
        this.completedMissionExercises = JSON.parse(localStorage.getItem('hf-kinetics-done') || '[]');
        this.currentState = 'med';
        // Timer state
        this.timerRunning = false;
        this.timerInterval = null;
        this.timerSeconds = 25 * 60;
        this.timerMode = 'work'; // 'work' or 'break'
        this.timerTotalSeconds = 25 * 60;
        this.pomoCount = parseInt(localStorage.getItem('hf-pomo-count')) || 0;
        this.audio = null;
        this.currentAudioKey = null;
        this.currentAudioGenre = null;
        
        // Audio Library - Extremely Reliable 24/7 HTTPS Streams
        this.AUDIO_LIBRARY = {
            'piano': 'https://stream.srg-ssr.ch/m/rsc_de/mp3_128', 
            'violin': 'https://strm112.1.fm/baroque_mobile_mp3', 
            'classical': 'https://strm112.1.fm/classical_mobile_mp3',
            'lofi': 'https://streams.ilovemusic.de/iloveradio17.mp3', 
            'ambient': 'https://ice1.somafm.com/spacestation-128-mp3', 
            'drone': 'https://ice1.somafm.com/dronezone-128-mp3'
        };

        // Inject Toast styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
        `;
        document.head.appendChild(style);

        this.init();
    }

    async init() {
        this.restoreTheme();
        this.restoreBrainDump();
        this.showRandomFortune();
        await this.loadData();
        await this.fetchExercisePresets();
        this.setupListeners();
        this.restoreImpulseLot();
        this.render();
        this.fetchRhythmData();
    }

    restoreTheme() {
        const saved = localStorage.getItem('hf-theme');
        if (saved === 'brutal') document.body.classList.add('brutal');
        if (saved === 'glitch') document.body.classList.add('glitch');
        this.updateThemeButton();
    }

    toggleTheme() {
        const hasGlitch = this.data && this.data.rewards && this.data.rewards.find(r => r.name === 'Glitch Theme' && r.unlocked);
        
        let current = localStorage.getItem('hf-theme') || 'cheerful';
        let next = 'cheerful';
        
        if (current === 'cheerful') {
            next = 'brutal';
        } else if (current === 'brutal') {
            next = hasGlitch ? 'glitch' : 'cheerful';
        } else if (current === 'glitch') {
            next = 'cheerful';
        }

        document.body.classList.remove('brutal', 'glitch');
        if (next !== 'cheerful') document.body.classList.add(next);
        
        localStorage.setItem('hf-theme', next);
        this.updateThemeButton();
    }

    updateThemeButton() {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        const saved = localStorage.getItem('hf-theme');
        if (saved === 'glitch') {
            btn.textContent = '👾 Glitch';
            btn.className = 'primary-btn pulse'; // Extra styling for glitch
        } else if (saved === 'brutal') {
            btn.textContent = '🔥 Brutal';
            btn.className = 'secondary-btn';
        } else {
            btn.textContent = '☀️ Cheerful';
            btn.className = 'secondary-btn';
        }
    }

    // ─── FORTUNE COOKIE ───
    showRandomFortune() {
        const el = document.getElementById('fortune-text');
        if (el) {
            const fortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
            el.textContent = fortune;
        }
    }

    // ─── BRAIN DUMP ───
    restoreBrainDump() {
        const dump = localStorage.getItem('hf-braindump') || '';
        const el = document.getElementById('brain-dump');
        if (el) el.value = dump;
    }

    saveBrainDump() {
        const el = document.getElementById('brain-dump');
        if (el) localStorage.setItem('hf-braindump', el.value);
    }

    clearBrainDump() {
        const el = document.getElementById('brain-dump');
        if (el) { el.value = ''; localStorage.removeItem('hf-braindump'); }
    }

    // ─── FOCUS TIMER ───
    startTimer() {
        if (this.timerRunning) {
            this.pauseTimer();
            return;
        }
        this.timerRunning = true;
        const btn = document.getElementById('timer-start');
        if (btn) btn.textContent = '⏸ Pause';
        
        // Aura Mode Activation
        document.body.classList.add('aura-active');
        if (!document.getElementById('aura-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'aura-overlay';
            document.body.appendChild(overlay);
            
            const breathing = document.createElement('div');
            breathing.className = 'aura-breathing';
            document.body.appendChild(breathing);
        }

        // Auto-start audio if a biome is selected
        if (this.currentAudioGenre) {
            this.playAudioForGenre(this.currentAudioGenre);
        }

        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            this.updateTimerDisplay();

            if (this.timerSeconds <= 0) {
                this.timerComplete();
            }
        }, 1000);
    }

    pauseTimer() {
        this.timerRunning = false;
        clearInterval(this.timerInterval);
        const btn = document.getElementById('timer-start');
        if (btn) btn.textContent = '▶ Resume';

        // Pause audio
        if (this.currentAudio) {
            this.currentAudio.pause();
        }
    }

    resetTimer() {
        this.timerRunning = false;
        clearInterval(this.timerInterval);
        this.timerMode = 'work';
        this.timerSeconds = 25 * 60;
        this.timerTotalSeconds = 25 * 60;
        const btn = document.getElementById('timer-start');
        if (btn) btn.textContent = '▶ Start';

        // Aura Mode Deactivation
        document.body.classList.remove('aura-active');
        document.getElementById('aura-overlay')?.classList.add('hidden');

        // Stop audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
            this.currentAudioGenre = null;
            document.querySelectorAll('.biome-btn').forEach(b => b.classList.remove('active'));
        }

        this.updateTimerDisplay();
        const badge = document.getElementById('timer-mode-badge');
        if (badge) badge.textContent = 'work';
    }

    timerComplete() {
        clearInterval(this.timerInterval);
        this.timerRunning = false;

        if (this.timerMode === 'work') {
            this.pomoCount++;
            localStorage.setItem('hf-pomo-count', this.pomoCount);
            // Particle burst!
            if (window.particles) {
                window.particles.burst(window.innerWidth / 2, window.innerHeight / 2, 'rgb(251, 191, 36)');
            }
            // Switch to break
            this.timerMode = 'break';
            this.timerSeconds = 5 * 60;
            this.timerTotalSeconds = 5 * 60;
        } else {
            // Switch to work
            this.timerMode = 'work';
            this.timerSeconds = 25 * 60;
            this.timerTotalSeconds = 25 * 60;
        }

        const btn = document.getElementById('timer-start');
        if (btn) btn.textContent = '▶ Start';
        const badge = document.getElementById('timer-mode-badge');
        if (badge) badge.textContent = this.timerMode;
        this.updateTimerDisplay();
        this.renderAchievements();

        const sessionsEl = document.getElementById('timer-sessions');
        if (sessionsEl) sessionsEl.textContent = `Sessions: ${this.pomoCount} 🍅`;
        
        // Deactivate Aura Mode on completion
        document.body.classList.remove("aura-active");
    }

    updateTimerDisplay() {
        const mins = Math.floor(this.timerSeconds / 60);
        const secs = this.timerSeconds % 60;
        const display = document.getElementById('timer-display');
        if (display) display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        // Update SVG ring
        const circle = document.getElementById('timer-circle');
        if (circle) {
            const circumference = 2 * Math.PI * 52;
            const progress = this.timerSeconds / this.timerTotalSeconds;
            circle.style.strokeDasharray = circumference;
            circle.style.strokeDashoffset = circumference * (1 - progress);
        }

        const sessionsEl = document.getElementById('timer-sessions');
        if (sessionsEl) sessionsEl.textContent = `Sessions: ${this.pomoCount} 🍅`;
    }

    // ─── ICEBREAKER ───
    pickIcebreaker() {
        const resultEl = document.getElementById('icebreaker-result');
        if (!resultEl) return;

        // Collect all incomplete items
        const pool = [];
        (this.data.habits || []).forEach(h => {
            if (h.is_micro_ritual || h.energy_required === 'low') {
                pool.push(`Try: "${h.sustainable}" (just the tiny version!)`);
            } else {
                pool.push(`Start with: "${h.sustainable}" for "${h.name}"`);
            }
        });
        (this.data.todos || []).filter(t => !t.is_completed).forEach(t => {
            pool.push(`Quick win: "${t.title}"`);
        });

        // Fallbacks
        if (pool.length === 0) {
            pool.push(
                "Drink a glass of water 💧",
                "Stand up and stretch for 30 seconds 🧘",
                "Take 3 deep breaths 🌬️",
                "Write 1 sentence about anything ✍️",
                "Look out a window for 10 seconds 🪟"
            );
        }

        const pick = pool[Math.floor(Math.random() * pool.length)];
        resultEl.textContent = pick;
        resultEl.style.animation = 'none';
        resultEl.offsetHeight; // trigger reflow
        resultEl.style.animation = 'slideIn 0.3s ease-out';
    }

    // ─── ACHIEVEMENTS ───
    renderAchievements() {
        const grid = document.getElementById('achievements-grid');
        if (!grid) return;

        grid.innerHTML = ACHIEVEMENTS.map(a => {
            const unlocked = a.check(this.data);
            return `
                <div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
                    <span class="achievement-icon">${a.icon}</span>
                    <div class="achievement-info">
                        <strong>${a.name}</strong>
                        <span class="muted small">${a.desc}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadData() {
        try {
            const response = await fetch('/api/data/');
            this.data = await response.json();
            
            // Auto-refresh rhythm when data changes significantly
            if (this.data.essence % 50 === 0) {
                this.fetchRhythmData();
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    }

    async fetchRhythmData() {
        try {
            const response = await fetch('/api/analytics/rhythm/');
            const result = await response.json();
            this.renderRhythmMap(result.rhythm);
        } catch (error) {
            console.error('Failed to fetch rhythm data:', error);
        }
    }

    renderRhythmMap(rhythm) {
        const container = document.getElementById('rhythm-map');
        if (!container) return;

        // Create 30 days grid
        const now = new Date();
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            const count = rhythm[dStr] || 0;
            const level = Math.min(5, count);
            days.push(`<div class="rhythm-day" data-level="${level}" title="${dStr}: ${count} completions"></div>`);
        }
        container.innerHTML = days.join('');
    }

    // ─── AMBIENT AUDIO ───
    toggleAudio(genre) {
        if (this.currentAudio && this.currentAudioGenre === genre && !this.currentAudio.paused) {
            this.currentAudio.pause();
            document.getElementById('toggle-audio-btn').textContent = '🎵 Play Stream';
        } else {
            this.currentAudioGenre = genre;
            this.playAudioForGenre(genre);
            const btn = document.getElementById('toggle-audio-btn');
            if (btn) btn.textContent = '⏸ Pause Stream';
        }
    }

    playAudioForGenre(genre) {
        if (this.currentAudio) this.currentAudio.pause();

        const streamUrl = this.AUDIO_LIBRARY[genre] || this.AUDIO_LIBRARY['lofi'];
        
        this.currentAudio = new Audio(streamUrl);
        this.currentAudio.play().catch(e => {
            console.warn("Audio playback blocked/failed:", e);
            this.showToast('Audio blocked by browser. Please interact with the page first.', 'error');
        });

        if (window.particles) {
            window.particles.burst(window.innerWidth / 2, window.innerHeight / 2, 'var(--sun)');
        }
    }

    // ─── IMPULSE PARKING LOT ───
    restoreImpulseLot() {
        const val = localStorage.getItem('hf-impulse') || '';
        const el = document.getElementById('impulse-input');
        if (el) el.value = val;
    }

    saveImpulseLot() {
        const el = document.getElementById('impulse-input');
        if (!el || !el.value) return;
        localStorage.setItem('hf-impulse', el.value);
        
        // Pro Persistence: Save to backend
        fetch('/api/impulse/save/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: el.value })
        }).catch(err => console.warn("Backend impulse save failed, using local only."));
    }

    // ─── BURNOUT SHIELD ───
    async toggleVacationMode() {
        try {
            const response = await fetch('/api/vacation/toggle/', { method: 'POST' });
            const result = await response.json();
            this.data.vacationActive = result.vacationActive;
            this.data.vacationUntil = result.vacationUntil;
            this.render();
        } catch (error) {
            console.error('Failed to toggle vacation mode:', error);
        }
    }

    setupListeners() {
        // Ritual Modals
        document.getElementById('add-habit-btn')?.addEventListener('click', () => {
            document.getElementById('modal-overlay')?.classList.remove('hidden');
        });
        document.getElementById('close-modal-btn')?.addEventListener('click', () => {
            document.getElementById('modal-overlay')?.classList.add('hidden');
        });
        document.getElementById('save-ritual-btn')?.addEventListener('click', () => {
            this.addHabit();
        });

        // Todo Modals
        document.getElementById('add-todo-btn')?.addEventListener('click', () => {
            document.getElementById('todo-modal-overlay')?.classList.remove('hidden');
        });
        document.getElementById('close-todo-modal-btn')?.addEventListener('click', () => {
            document.getElementById('todo-modal-overlay')?.classList.add('hidden');
        });
        document.getElementById('save-todo-btn')?.addEventListener('click', () => {
            const titleEl = document.getElementById('todo-title');
            if (titleEl.value) {
                this.addTodo(titleEl.value);
                titleEl.value = '';
                document.getElementById('todo-modal-overlay')?.classList.add('hidden');
            }
        });


        document.getElementById('start-healthy-week-btn')?.addEventListener('click', () => {
            this.initHealthyWeek();
        });
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });
        document.getElementById('burnout-shield-btn')?.addEventListener('click', () => {
            this.toggleVacationMode();
        });

        // Energy Selector
        document.getElementById('energy-selector')?.querySelectorAll('.state-pill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.updateState(e.currentTarget.dataset.state);
            });
        });

        // ─── NEW FEATURE LISTENERS ───
        document.getElementById('timer-start')?.addEventListener('click', () => this.startTimer());
        document.getElementById('timer-reset')?.addEventListener('click', () => this.resetTimer());
        document.getElementById('icebreaker-btn')?.addEventListener('click', () => this.pickIcebreaker());
        document.getElementById('new-fortune-btn')?.addEventListener('click', () => this.showRandomFortune());
        document.getElementById('clear-dump-btn')?.addEventListener('click', () => this.clearBrainDump());
        document.getElementById('brain-dump')?.addEventListener('input', () => this.saveBrainDump());

        // Audio controls
        document.getElementById('toggle-audio-btn')?.addEventListener('click', () => {
            const genre = document.getElementById('audio-genre-select').value;
            this.toggleAudio(genre);
        });
        document.getElementById('audio-genre-select')?.addEventListener('change', (e) => {
            if (this.currentAudio && !this.currentAudio.paused) {
                this.playAudioForGenre(e.target.value); // switch immediately
            }
        });

        // Gratitude / Water logic
        document.getElementById('water-tree-btn')?.addEventListener('click', () => {
            if (this.data && this.data.essence < 10) {
                this.showToast('Not enough ✨ Essence! Complete a ritual or two to water your tree again.', 'error');
                return;
            }
            document.getElementById('gratitude-modal-overlay')?.classList.remove('hidden');
            document.getElementById('gratitude-seed-input')?.focus();
        });
        document.getElementById('close-gratitude-modal-btn')?.addEventListener('click', () => {
            document.getElementById('gratitude-modal-overlay')?.classList.add('hidden');
        });
        document.getElementById('confirm-water-btn')?.addEventListener('click', () => {
            const content = document.getElementById('gratitude-seed-input').value;
            this.confirmWaterTree(content);
        });

        // ─── FEATURE RAMPAGE LISTENERS ───
        document.getElementById('ritual-library-btn')?.addEventListener('click', () => this.showRitualLibrary());
        document.getElementById('close-library-btn')?.addEventListener('click', () => {
            document.getElementById('library-modal-overlay')?.classList.add('hidden');
        });
        document.getElementById('impulse-input')?.addEventListener('input', () => this.saveImpulseLot());

        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.renderRewards(pill.dataset.category);
            });
        });

        // Tab Switching
        document.querySelectorAll('.main-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    async showRitualLibrary() {
        const modal = document.getElementById('library-modal-overlay');
        const container = document.getElementById('library-content');
        if (!modal || !container) return;

        modal.classList.remove('hidden');
        container.innerHTML = '<p class="muted">Scanning archives...</p>';

        try {
            const response = await fetch('/api/presets/rituals/');
            const { presets } = await response.json();
            container.innerHTML = presets.map(p => `
                <div class="preset-card glass" onclick="window.app.importPreset(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                    <span class="badge secondary small">${p.energy}</span>
                    <h4>${p.name}</h4>
                    <span class="tiny">${p.sustainable}</span>
                    <button class="minimal-btn" style="float:right;">+</button>
                </div>
            `).join('');
        } catch (e) {
            container.innerHTML = '<p class="error">Library unreachable.</p>';
        }
    }

    async importPreset(p) {
        try {
            await fetch('/api/habits/add/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: p.name,
                    sustainable: p.sustainable,
                    reward: p.reward,
                    energy_required: p.energy,
                    is_micro_ritual: p.is_micro
                })
            });
            await this.loadData();
            this.render();
            document.getElementById('library-modal-overlay')?.classList.add('hidden');
        } catch (e) {
            console.error('Import failed:', e);
        }
    }

    async completeQuest(id) {
        try {
            const response = await fetch(`/api/quests/complete/${id}/`, { method: 'POST' });
            if (response.ok) {
                await this.loadData();
                this.render();
                if (window.particles) {
                    window.particles.burst(window.innerWidth / 2, window.innerHeight / 2, 'rgb(96, 165, 250)');
                }
            }
        } catch (e) {
            console.error('Quest completion failed:', e);
        }
    }

    async confirmWaterTree(content) {
        if (!content) return;
        try {
            // Log the win
            await fetch('/api/daily-win/add/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
            // Water the tree
            const response = await fetch('/api/tree/water/', { method: 'POST' });
            if (response.ok) {
                await this.loadData();
                this.render();
            }
            document.getElementById('gratitude-modal-overlay')?.classList.add('hidden');
            document.getElementById('gratitude-seed-input').value = '';
        } catch (error) {
            console.error('Watering failed:', error);
        }
    }

    async updateState(state) {
        this.currentState = state;
        document.querySelectorAll('.state-pill').forEach(p => {
            p.classList.toggle('active', p.dataset.state === state);
        });
        
        const energyMap = { 'low': 30, 'med': 60, 'high': 100 };
        await fetch('/api/energy/update/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ energy: energyMap[state] })
        });

        this.render();
    }

    async initHealthyWeek() {
        try {
            const response = await fetch('/api/seed-healthy-week/', { method: 'POST' });
            if (response.ok) {
                await this.loadData();
                this.render();
            }
        } catch (error) {
            console.error('Failed to seed healthy week:', error);
        }
    }

    async addTodo(title) {
        try {
            const response = await fetch('/api/todos/add/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, energy_required: this.currentState })
            });
            if (response.ok) {
                await this.loadData();
                this.render();
            }
        } catch (error) {
            console.error('Failed to add todo:', error);
        }
    }

    async toggleTodo(id) {
        try {
            const response = await fetch(`/api/todos/toggle/${id}/`, { method: 'POST' });
            if (response.ok) {
                await this.loadData();
                this.render();
            }
        } catch (error) {
            console.error('Failed to toggle todo:', error);
        }
    }

    async addHabit() {
        const nameEl = document.getElementById('habit-name');
        const sustainableEl = document.getElementById('habit-sustainable');
        const rewardEl = document.getElementById('habit-reward');
        const energyEl = document.getElementById('habit-energy');
        const microEl = document.getElementById('habit-micro');

        if (!nameEl.value || !sustainableEl.value) return;

        const newHabit = {
            name: nameEl.value,
            sustainable: sustainableEl.value,
            reward: parseInt(rewardEl.value) || 5,
            energy_required: energyEl.value,
            is_micro_ritual: microEl.checked
        };

        try {
            const response = await fetch('/api/habits/add/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newHabit)
            });
            
            if (response.ok) {
                await this.loadData();
                this.render();
                nameEl.value = '';
                sustainableEl.value = '';
                document.getElementById('modal-overlay')?.classList.add('hidden');
            }
        } catch (error) {
            console.error('Failed to add habit:', error);
        }
    }

    async completeHabit(id, rect) {
        try {
            const response = await fetch(`/api/habits/complete/${id}/`, { method: 'POST' });
            if (response.ok) {
                if (window.particles) {
                    window.particles.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 'rgb(188, 140, 255)');
                }
                await this.loadData();
                this.render();
            }
        } catch (error) {
            console.error('Failed to complete habit:', error);
        }
    }



    showToast(message, type='info') {
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.position = 'fixed';
            toastContainer.style.bottom = '20px';
            toastContainer.style.right = '20px';
            toastContainer.style.zIndex = '9999';
            toastContainer.style.display = 'flex';
            toastContainer.style.flexDirection = 'column';
            toastContainer.style.gap = '10px';
            document.body.appendChild(toastContainer);
        }
        
        const toast = document.createElement('div');
        toast.className = `glass`;
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        toast.style.borderLeft = type === 'error' ? '4px solid var(--sun)' : '4px solid var(--mint)';
        toast.style.animation = 'slideInRight 0.3s ease forwards';
        toast.style.color = 'var(--text)';
        toast.style.fontWeight = '500';
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    render() {
        try {
            this.updateElementText('essence-count', this.data.essence);
            this.updateElementText('focus-points', this.data.focusPoints);

            if (this.data.displayName) {
                this.updateElementText('user-display-name', this.data.displayName);
            }

            // Burnout Shield Status
            const shieldBtn = document.getElementById('burnout-shield-btn');
            if (shieldBtn) {
                shieldBtn.classList.toggle('active', this.data.vacationActive);
                shieldBtn.textContent = this.data.vacationActive ? '🛡️ Shield: ACTIVE' : '🛡️ Shield: OFF';
            }

            const treeVisual = document.getElementById('tree-stage');
            if (treeVisual) {
                treeVisual.innerHTML = `<div class="tree-visual"> ${TREE_STAGES[this.data.treeStage] || '🌱'} </div>`;
            }
            const progress = document.getElementById('tree-progress');
            if (progress) progress.style.width = `${this.data.treeProgress || 0}%`;
            
            this.updateElementText('tree-status', `Evolution: ${this.data.treeProgress || 0}%`);
            this.updateElementText('tree-status-badge', `Stage ${(this.data.treeStage || 0) + 1}`);

            const todoList = document.getElementById('todo-list');
            if (todoList) {
                todoList.innerHTML = (this.data.todos || []).map(t => `
                    <div class="todo-item ${t.is_completed ? 'completed' : ''}" data-id="${t.id}">
                        <div class="todo-check" onclick="window.app.toggleTodo(${t.id})"></div>
                        <span>${t.title}</span>
                        <span class="badge secondary small">${t.energy_required}</span>
                    </div>
                `).join('') || '<p class="muted small">No active focus tasks...</p>';
            }

            const evidenceList = document.getElementById('evidence-list');
            if (evidenceList) {
                evidenceList.innerHTML = (this.data.evidence || []).map(e => `
                    <div class="evidence-card">
                        <span class="title">${e.title}</span>
                        <span class="meta">${new Date(e.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                `).join('') || '<p class="muted small">Empty...</p>';
            }

            const suggestionEl = document.getElementById('ritual-suggestion');
            if (suggestionEl) {
                const map = { 'low': "Focus on 'Tiny' versions.", 'med': "Steady flow.", 'high': "Hyperfocus time." };
                suggestionEl.textContent = map[this.currentState] || "Ready...";
            }

            const habitList = document.getElementById('habit-list');
            if (habitList) {
                habitList.innerHTML = this.data.habits.map(h => {
                    const isMatch = h.energy_required === this.currentState || h.is_micro_ritual;
                    return `
                    <div class="habit-card energy-${h.energy_required}" style="opacity: ${isMatch ? 1 : 0.4}">
                        <span class="habit-tag">${h.is_micro_ritual ? '⚡ Micro' : h.energy_required}</span>
                        <h3>${this.currentState === 'low' ? h.sustainable : h.name}</h3>
                        <p class="muted small">${h.sustainable}</p>
                        <div class="card-actions">
                            <span class="badge secondary">🔥 ${parseFloat(h.streak).toFixed(1)}</span>
                        </div>
                        <div class="complete-btn-wrapper">
                            <button class="complete-btn initiate-trigger" data-id="${h.id}">
                                <div class="charge-progress"></div>
                                <span class="btn-text">Hold to Initiate (+${h.reward} ✨)</span>
                            </button>
                        </div>
                    </div>
                `}).join('');
                this.setupHoldToInitiate();
            }

            // Achievements
            const achievementGrid = document.getElementById('achievements-grid');
            if (achievementGrid && this.data.achievements) {
                achievementGrid.innerHTML = this.data.achievements.map(a => `
                    <div class="achievement-card glass">
                        <span class="achievement-icon">${a.icon || '🏆'}</span>
                        <h3>${a.title}</h3>
                        <p>${a.description}</p>
                        <div class="badge secondary small" style="margin-top:10px;">Unlocked</div>
                    </div>
                `).join('') || '<p class="muted small">No trophies yet. Keep forging!</p>';
            }

            const rewardList = document.getElementById('reward-list');
            if (rewardList) {
                const category = document.querySelector('.filter-pill.active')?.dataset.category || 'all';
                this.renderRewards(category);
            }

            // Quests
            const questList = document.getElementById('quest-list');
            if (questList) {
                questList.innerHTML = (this.data.quests || []).map(q => `
                    <div class="quest-card ${q.is_completed ? 'completed' : ''}" onclick="window.app.completeQuest(${q.id})">
                        <span class="quest-cat">${q.category}</span>
                        <h4>${q.title}</h4>
                        <p class="muted small">${q.description}</p>
                        <span class="quest-reward">+${q.essence_reward} ✨</span>
                        ${q.is_completed ? '<span class="badge secondary small" style="position:absolute; bottom:12px; right:12px;">DONE</span>' : ''}
                    </div>
                `).join('') || '<p class="muted small">No quests active today.</p>';
            }

            // Render new features
            this.renderAchievements();
            this.updateTimerDisplay();
            this.renderKinetics();
        } catch (e) {
            console.error('Render error:', e);
        }
    }

    renderRewards(category = 'all') {
        const grid = document.getElementById('reward-list');
        if (!grid) return;

        let filtered = this.data.rewards || [];
        if (category !== 'all') {
            filtered = filtered.filter(r => r.category === category);
        }

        grid.innerHTML = filtered.map(r => `
            <div class="reward-card ${r.unlocked ? 'unlocked' : ''}" id="reward-${r.id}">
                <div style="font-size: 2rem; margin-bottom: 10px;">${r.icon || '🎁'}</div>
                <div class="badge secondary small" style="margin-bottom: 8px;">${r.rarity || 'common'}</div>
                <h3>${r.name}</h3>
                <div class="card-actions">
                    <span class="cost">${r.cost} ✨</span>
                    ${r.unlocked ? 
                        '<span class="badge secondary">UNLOCKED</span>' : 
                        `<button class="secondary-btn small" onclick="window.app.redeemReward(${r.id})">Redeem</button>`
                    }
                </div>
            </div>
        `).join('') || '<p class="muted small">No rewards in this category yet.</p>';
    }

    async redeemReward(id) {
        const card = document.getElementById(`reward-${id}`);
        // Identify the reward based on data
        let rewardName = '';
        if (this.data && this.data.rewards) {
            const rewardObj = this.data.rewards.find(r => r.id === id);
            if (rewardObj) rewardName = rewardObj.name;
        }

        try {
            const response = await fetch(`/api/rewards/redeem/${id}/`, { method: 'POST' });
            if (response.ok) {
                card?.classList.add('unlocking');
                if (window.particles) {
                    window.particles.burst(window.innerWidth / 2, window.innerHeight / 2, 'var(--lavender)');
                }

                // Specifically handle Glitch Theme activation
                if (rewardName === 'Glitch Theme') {
                    document.body.classList.remove('brutal', 'cheerful');
                    document.body.classList.add('glitch');
                    localStorage.setItem('hf-theme', 'glitch');
                    this.updateThemeButton();
                    this.showToast('👾 SYSTEM COMPROMISED. GLITCH THEME ACTIVATED.', 'info');
                }

                setTimeout(async () => {
                    await this.loadData();
                    this.render();
                }, 600);
            } else {
                const data = await response.json();
                alert(data.msg || "Insufficient essence!");
            }
        } catch (e) {
            console.error('Redemption failed:', e);
        }
    }

    updateElementText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text !== undefined ? text : '...';
    }

    // ─── KINETICS MODULE ───
    async fetchExercisePresets() {
        try {
            const resp = await fetch('/api/presets/exercises/');
            const data = await resp.json();
            this.exercisePresets = data.presets || [];
        } catch (e) { console.error("Kinetics presets failed:", e); }
    }

    setKineticsMode(mode) {
        this.kineticsMode = mode;
        document.getElementById('mode-daily').classList.toggle('active', mode === 'daily');
        document.getElementById('mode-campaign').classList.toggle('active', mode === 'campaign');
        this.renderKinetics();

        if (mode === 'campaign') {
            setTimeout(() => this.initKinetics3D(), 100);
        }
    }

    initKinetics3D() {
        if (!this.kinetics3D) {
            this.kinetics3D = new window.Kinetics3D('kinetics-3d-canvas');
        }
    }

    toggleDietNotes() {
        const panel = document.getElementById('diet-notes-panel');
        if (panel) {
            panel.classList.toggle('hidden');
            if (!panel.classList.contains('hidden')) {
                document.getElementById('diet-text').textContent = window.KINETICS_META.diet;
                document.getElementById('progression-text').textContent = `Note: ${window.KINETICS_META.progression}`;
            }
        }
    }

    switchTab(tabId) {
        document.querySelectorAll('.main-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        document.querySelectorAll('.tab-view').forEach(view => {
            view.classList.add('hidden');
        });
        
        const targetView = tabId === 'rituals' ? 'rituals-view' : (tabId === 'kinetics' ? 'kinetics-view' : 'library-view');
        if (tabId === 'library') {
            document.getElementById('rituals-view').classList.remove('hidden');
            document.getElementById('ritual-library-modal-overlay')?.classList.remove('hidden');
        } else {
            document.getElementById(targetView)?.classList.remove('hidden');
        }
    }

    renderKinetics() {
        const grid = document.getElementById('kinetics-grid');
        const campaign = document.getElementById('campaign-view');
        if (!grid || !campaign) return;

        if (this.kineticsMode === 'daily') {
            grid.classList.remove('hidden');
            campaign.classList.add('hidden');
            grid.innerHTML = (this.exercisePresets || []).map(ex => `
                <div class="reward-card exercise-card">
                    <span class="exercise-icon">${ex.icon}</span>
                    <span class="badge secondary small">${ex.energy} energy</span>
                    <h3>${ex.name}</h3>
                    <p class="exercise-desc">${ex.desc}</p>
                    <div class="card-actions">
                        <span class="cost">${ex.reward} ✨</span>
                        <button class="primary-btn small" onclick="window.app.completeExercise('${ex.name}', ${ex.reward})">Done</button>
                    </div>
                </div>
            `).join('');
        } else {
            grid.classList.add('hidden');
            campaign.classList.remove('hidden');
            this.renderCampaign();
        }
    }

    renderCampaign() {
        const mission = window.KINETICS_CAMPAIGN[this.currentMissionIndex];
        if (!mission) return;

        document.getElementById('current-mission-title').textContent = mission.title;
        document.getElementById('current-mission-objective').textContent = mission.objective;
        document.getElementById('mission-tip').textContent = mission.microHabit;

        const list = document.getElementById('mission-exercises-list');
        const progress = (this.completedMissionExercises.length / mission.exercises.length) * 100;
        document.getElementById('mission-progress').style.width = progress + '%';

        list.innerHTML = mission.exercises.map(ex => {
            const isDone = this.completedMissionExercises.includes(ex.id);
            return `
                <div class="mission-exercise-card glass ${isDone ? 'done' : ''}" style="border-left: 5px solid ${ex.ui.color}">
                    <div class="ex-info">
                        <h4>${ex.name}</h4>
                        <div class="ex-meta small muted">
                            <span>${ex.sets}</span> | <span>Rest: ${ex.rest}</span>
                        </div>
                        <p class="ex-instruction small">${ex.instruction}</p>
                        <div class="ex-cue small"><b>Cue:</b> ${ex.cue}</div>
                    </div>
                    <div class="ex-actions">
                        <div class="xp-reward">+${ex.xp} XP</div>
                        ${isDone ? 
                            '<span class="badge secondary">SUCCESS</span>' : 
                            `<div class="btn-group-v">
                                <button class="action-trigger-btn" onclick="window.app.startMissionExercise('${ex.id}', '${ex.anim}', '${ex.name}', ${ex.xp}, ${ex.essence}, '${ex.ui.color}', 30)">START</button>
                                <button class="minimal-btn tiny" onclick="window.app.completeMissionExercise('${ex.id}', '${ex.name}', ${ex.xp / 2}, ${ex.essence / 2}, '${ex.ui.color}', true)">Minimal Version</button>
                            </div>`
                        }
                    </div>
                    <div class="alt-options tiny">
                        <span>Alt: ${ex.easier}</span>
                    </div>
                </div>
            `;
        }).join('');

        if (this.completedMissionExercises.length === mission.exercises.length) {
            list.innerHTML += `
                <div class="next-level-area glass" style="text-align:center; padding: 20px; margin-top:20px;">
                    <h3>MISSION ACCOMPLISHED 🏆</h3>
                    <p class="small muted">You've mastered this level. Ready to proceed?</p>
                    <button class="primary-btn" onclick="window.app.advanceMission()">Next Level</button>
                </div>
            `;
        }
    }

    async completeMissionExercise(id, name, xp, essence, color, isMinimal = false) {
        if (this.completedMissionExercises.includes(id)) return;
        
        try {
            const resp = await fetch('/api/exercises/complete/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: (isMinimal ? "Minimal: " : "Mission: ") + name, reward: essence })
            });

            if (resp.ok) {
                this.completedMissionExercises.push(id);
                localStorage.setItem('hf-kinetics-done', JSON.stringify(this.completedMissionExercises));
                
                const msg = isMinimal ? `✨ ${xp} XP (Minimal Sync). Build that habit!` : `✨ ${xp} XP GAINED. ${name} SYNCED.`;
                this.showToast(msg, isMinimal ? 'info' : 'success');
                
                if (window.particles) {
                    window.particles.burst(window.innerWidth / 2, window.innerHeight / 2, color);
                }
                
                this.data.focusPoints += Math.floor(xp / 10);
                this.render();
                this.stopMissionExercise();
            }
        } catch (e) { console.error(e); }
    }

    startMissionExercise(id, anim, name, xp, essence, color, seconds) {
        if (!this.kinetics3D) {
            this.initKinetics3D();
        }
        if (this.kinetics3D) {
            this.kinetics3D.setAnimation(anim);
        }

        // Show Timer
        const timerWrap = document.getElementById('mission-timer-overlay');
        if (timerWrap) timerWrap.classList.remove('hidden');

        this.missionTimeRemaining = parseInt(seconds) || 30;
        this.updateTimerDisplay();

        if (this.missionTimer) clearInterval(this.missionTimer);
        this.missionTimer = setInterval(() => {
            this.missionTimeRemaining--;
            this.updateTimerDisplay();
            if (this.missionTimeRemaining <= 0) {
                clearInterval(this.missionTimer);
                this.completeMissionExercise(id, name, xp, essence, color);
            }
        }, 1000);
    }

    stopMissionExercise() {
        if (this.missionTimer) clearInterval(this.missionTimer);
        document.getElementById('mission-timer-overlay')?.classList.add('hidden');
        if (this.kinetics3D) this.kinetics3D.setAnimation(null);
    }

    updateTimerDisplay() {
        const el = document.getElementById('timer-display');
        if (!el) return;
        const mins = Math.floor(this.missionTimeRemaining / 60);
        const secs = this.missionTimeRemaining % 60;
        el.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    advanceMission() {
        this.currentMissionIndex = (this.currentMissionIndex + 1) % window.KINETICS_CAMPAIGN.length;
        this.completedMissionExercises = [];
        localStorage.setItem('hf-kinetics-level', this.currentMissionIndex);
        localStorage.setItem('hf-kinetics-done', '[]');
        this.showToast('🚀 LEVEL UP! NEW MISSION ASSIGNED.', 'info');
        this.render();
    }

    setupHoldToInitiate() {
        const btns = document.querySelectorAll('.initiate-trigger');
        btns.forEach(btn => {
            let timer;
            let charge = 0;
            const progress = btn.querySelector('.charge-progress');
            const text = btn.querySelector('.btn-text');
            if (text) text.style.pointerEvents = 'none';

            const startAction = () => {
                btn.classList.add('charging');
                timer = setInterval(() => {
                    charge += 4;
                    if (progress) progress.style.width = charge + '%';
                    if (charge >= 100) {
                        clearInterval(timer);
                        this.finishAction(btn);
                    }
                }, 20);
            };

            const stopAction = () => {
                btn.classList.remove('charging');
                clearInterval(timer);
                charge = 0;
                if (progress) progress.style.width = '0%';
            };

            btn.addEventListener('mousedown', (e) => { if (e.button === 0) startAction(); });
            btn.addEventListener('mouseup', stopAction);
            btn.addEventListener('mouseleave', stopAction);
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); startAction(); }, { passive: false });
            btn.addEventListener('touchend', stopAction);
        });
    }

    finishAction(btn) {
        const id = btn.dataset.id;
        btn.classList.add('finished');
        if (btn.querySelector('.btn-text')) btn.querySelector('.btn-text').textContent = "DONE! 💫";
        const rect = btn.getBoundingClientRect();
        this.completeHabit(id, rect);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new HabitForge();
});
