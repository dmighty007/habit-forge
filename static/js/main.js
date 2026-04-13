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
            rewards: [],
            evidence: [],
            todos: []
        };
        this.currentState = 'med';
        // Timer state
        this.timerRunning = false;
        this.timerInterval = null;
        this.timerSeconds = 25 * 60;
        this.timerMode = 'work'; // 'work' or 'break'
        this.timerTotalSeconds = 25 * 60;
        this.pomoCount = parseInt(localStorage.getItem('hf-pomo-count')) || 0;
        this.init();
    }

    async init() {
        this.restoreTheme();
        this.restoreBrainDump();
        this.showRandomFortune();
        await this.loadData();
        this.setupListeners();
        this.render();
    }

    restoreTheme() {
        const saved = localStorage.getItem('hf-theme');
        if (saved === 'brutal') {
            document.body.classList.add('brutal');
        }
        this.updateThemeButton();
    }

    toggleTheme() {
        document.body.classList.toggle('brutal');
        const isBrutal = document.body.classList.contains('brutal');
        localStorage.setItem('hf-theme', isBrutal ? 'brutal' : 'cheerful');
        this.updateThemeButton();
    }

    updateThemeButton() {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        const isBrutal = document.body.classList.contains('brutal');
        btn.textContent = isBrutal ? '🔥 Brutal' : '☀️ Cheerful';
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
    }

    resetTimer() {
        this.timerRunning = false;
        clearInterval(this.timerInterval);
        this.timerMode = 'work';
        this.timerSeconds = 25 * 60;
        this.timerTotalSeconds = 25 * 60;
        const btn = document.getElementById('timer-start');
        if (btn) btn.textContent = '▶ Start';
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
        } catch (error) {
            console.error('Failed to load data:', error);
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

        document.getElementById('water-tree-btn')?.addEventListener('click', () => {
            this.waterTree();
        });
        document.getElementById('start-healthy-week-btn')?.addEventListener('click', () => {
            this.initHealthyWeek();
        });
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.toggleTheme();
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

    async waterTree() {
        try {
            const response = await fetch('/api/tree/water/', { method: 'POST' });
            if (response.ok) {
                await this.loadData();
                this.render();
            }
        } catch (error) {
            console.error('Failed to water tree:', error);
        }
    }

    render() {
        try {
            this.updateElementText('essence-count', this.data.essence);
            this.updateElementText('focus-points', this.data.focusPoints);

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

            const rewardList = document.getElementById('reward-list');
            if (rewardList) {
                rewardList.innerHTML = (this.data.rewards || []).map(r => `
                    <div class="reward-card">
                        <h3>${r.name}</h3>
                        <div class="card-actions">
                            <span>✨ ${r.cost}</span>
                            <button class="secondary-btn" ${this.data.essence < r.cost ? 'disabled' : ''}>Redeem</button>
                        </div>
                    </div>
                `).join('');
            }

            // Render new features
            this.renderAchievements();
            this.updateTimerDisplay();
        } catch (e) {
            console.error('Render error:', e);
        }
    }

    updateElementText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text !== undefined ? text : '...';
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
