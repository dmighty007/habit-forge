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
        this.kineticsFallback = null;
        this.missionTimer = null;
        this.missionPrepTimer = null;
        this.missionTimeRemaining = 0;
        this.missionTotalTime = 0;
        this.missionPaused = false;
        this.currentExerciseParams = null; // Store for restart logic
        this.currentMissionIndex = parseInt(localStorage.getItem('hf-kinetics-level')) || 0;
        this.viewingMissionIndex = this.currentMissionIndex;
        this.completedMissionExercises = JSON.parse(localStorage.getItem('hf-kinetics-done') || '[]');
        this.exerciseHistory = JSON.parse(localStorage.getItem('hf-kinetics-history') || '{}');
        this.historyViewDate = new Date().toISOString().split('T')[0];
        this.restlessModeEnabled = localStorage.getItem('hf-kinetics-restless-mode') === 'true';
        this.restlessActive = false;
        this.restlessQueue = [];
        this.currentState = 'med';
        this.speechSynth = window.speechSynthesis;
        this.restlessVoiceLine = this.speechSynth ? 'Voice guide ready' : 'Voice unavailable';
        this.userPersona = localStorage.getItem('hf-user-persona') || 'male';
        this.coachVoiceEnabled = localStorage.getItem('hf-coach-voice') !== 'false';
        window.KINETICS_CAMPAIGN = (window.KINETICS_DATA && window.KINETICS_DATA[this.userPersona]) || window.MALE_CAMPAIGN || [];

        this.missionNarrationState = {
            halfwaySpoken: false,
            tenSecondSpoken: false
        };
        this.exerciseDemoLibrary = {
            pushup: { src: '/static/media/kinetics_generated/pushup-demo.gif', caption: 'High-intensity push-up flow.' },
            pushup_incline: { src: '/static/media/kinetics_generated/local_incline_pushup.gif', caption: 'Incline push-up flow.' },
            squat: { src: '/static/media/kinetics_generated/squat-demo.gif', caption: 'Deep squat form.' },
            jacks: { src: '/static/media/kinetics_generated/jacks-demo.gif', caption: 'Full body aerobic warm-up.' },
            leg_raise: { src: '/static/media/kinetics_generated/leg-raise-demo.gif', caption: 'Lower abdominal focus.' },
            plank: { src: '/static/media/kinetics_generated/plank-demo.gif', caption: 'Core isometric hold.' },
            dips: { src: '/static/media/kinetics_generated/local_dips.gif', caption: 'Triceps focused dip.' },
            row: { src: '/static/media/kinetics_generated/local_row.gif', caption: 'Back stabilization row.' },
            curl: { src: '/static/media/kinetics_generated/local_curl.gif', caption: 'Bicep isolation.' },
            lunge: { src: '/static/media/kinetics_generated/lunge-demo.gif', caption: 'Forward stepping lunge.' },
            bridge: { src: '/static/media/kinetics_generated/local_bridge.gif', caption: 'Glute and hamstring activation.' },
            calf_raise: { src: '/static/media/kinetics_generated/local_calf_raise.gif', caption: 'Calf isolation movement.' },
            stretch: { src: '/static/media/kinetics_generated/stretch-demo.gif', caption: 'Recovery stretching.' },
            stretch_easy: { src: '/static/media/kinetics_generated/stretch-demo.gif', caption: 'Gentle mobility flow.' },
            walk: { src: '/static/media/kinetics_generated/local_walk.gif', caption: 'Light aerobic activity.' },
            breathe: { src: '/static/media/kinetics_generated/breathe-demo.gif', caption: 'Parasympathetic focus.' },
            jump_squat: { src: '/static/media/kinetics_generated/local_jump_squat.gif', caption: 'Explosive lower body movement.' },
            plank_taps: { src: '/static/media/kinetics_generated/local_plank_taps.gif', caption: 'Core anti-rotation.' },
            climber: { src: '/static/media/kinetics_generated/local_climber.gif', caption: 'Dynamic core movement.' },
            pushup_slow: { src: '/static/media/kinetics_generated/pushup-demo.gif', caption: 'Eccentric focus push-up.' },
            squat_slow: { src: '/static/media/kinetics_generated/squat-demo.gif', caption: 'Eccentric focus squat.' },
            wall_sit: { src: '/static/media/kinetics_generated/local_wall_sit.gif', caption: 'Isometric quad hold.' },
            side_plank: { src: '/static/media/kinetics_generated/local_side_plank.gif', caption: 'Oblique isometric hold.' },
            dance: { src: '/static/media/kinetics_generated/generic-demo.gif', caption: 'Keep it playful and keep moving.' },
            // Female specific mappings
            dead_bug: { src: '/static/media/kinetics_generated/leg-raise-demo.gif', caption: 'Core stability and coordination.' },
            heel_tap: { src: '/static/media/kinetics_generated/leg-raise-demo.gif', caption: 'Oblique and lower core focus.' },
            clamshell: { src: '/static/media/kinetics_generated/local_bridge.gif', caption: 'Hip and outer glute activation.' },
            bird_dog: { src: '/static/media/kinetics_generated/plank-demo.gif', caption: 'Full chain stability.' },
            punch: { src: '/static/media/kinetics_generated/jacks-demo.gif', caption: 'Dynamic arm movement.' },
            tricep_ext: { src: '/static/media/kinetics_generated/local_curl.gif', caption: 'Tricep isolation.' },
            kickback: { src: '/static/media/kinetics_generated/local_curl.gif', caption: 'Tricep sculpting.' },
            lateral_raise: { src: '/static/media/kinetics_generated/local_curl.gif', caption: 'Shoulder toning.' },
            front_raise: { src: '/static/media/kinetics_generated/local_curl.gif', caption: 'Front shoulder focus.' },
            press: { src: '/static/media/kinetics_generated/local_curl.gif', caption: 'Vertical push strength.' },
            chest_press: { src: '/static/media/kinetics_generated/local_curl.gif', caption: 'Lying chest focus.' },
            reverse_fly: { src: '/static/media/kinetics_generated/local_row.gif', caption: 'Rear delt and upper back focus.' },
            arm_circles: { src: '/static/media/kinetics_generated/stretch-demo.gif', caption: 'Shoulder mobility.' },
            walk_fast: { src: '/static/media/kinetics_generated/local_walk.gif', caption: 'Energized walking pace.' },
            step_touch: { src: '/static/media/kinetics_generated/jacks-demo.gif', caption: 'Side-to-side step pattern.' },
            punch_cross: { src: '/static/media/kinetics_generated/jacks-demo.gif', caption: 'Cross-body punch combination.' },
            crunch_seated: { src: '/static/media/kinetics_generated/leg-raise-demo.gif', caption: 'Seated core contraction.' },
            bridge_hold: { src: '/static/media/kinetics_generated/local_bridge.gif', caption: 'Static glute bridge hold.' },
            plank_wall: { src: '/static/media/kinetics_generated/plank-demo.gif', caption: 'Wall plank hold.' },
            reverse_march: { src: '/static/media/kinetics_generated/leg-raise-demo.gif', caption: 'Supine reverse march.' },
            leg_raise_side: { src: '/static/media/kinetics_generated/leg-raise-demo.gif', caption: 'Side-lying leg lift.' },
            generic: { src: '/static/media/kinetics_generated/generic-demo.gif', caption: 'Follow the exercise cues.' }
        };
        
        // INTERCEPT ALL ALERTS: Force non-blocking toasts
        window.alert = (msg) => this.showToast(msg, 'error');

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

    initSettingsModal() {
        const avatarBtn = document.getElementById('user-avatar-btn');
        const modal = document.getElementById('settings-modal-overlay');
        const closeBtn = document.getElementById('close-settings-btn');
        const saveBtn = document.getElementById('save-settings-btn');
        const voiceBtns = document.querySelectorAll('[data-voice]');
        const personaCards = document.querySelectorAll('[data-persona]');

        if (avatarBtn && modal) {
            avatarBtn.onclick = () => {
                this.updateSettingsUI();
                modal.classList.remove('hidden');
            };
        }

        const gearBtn = document.getElementById('open-settings-btn');
        if (gearBtn && modal) {
            gearBtn.onclick = () => {
                this.updateSettingsUI();
                modal.classList.remove('hidden');
            };
        }

        if (closeBtn && modal) {
            closeBtn.onclick = () => modal.classList.add('hidden');
        }

        voiceBtns.forEach(btn => {
            btn.onclick = () => {
                voiceBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        personaCards.forEach(card => {
            card.onclick = () => {
                personaCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            };
        });

        if (saveBtn) {
            saveBtn.onclick = () => {
                this.saveCoachSettings();
                modal.classList.add('hidden');
            };
        }
    }

    updateSettingsUI() {
        const voiceBtns = document.querySelectorAll('[data-voice]');
        voiceBtns.forEach(btn => {
            if (btn.dataset.voice === (this.coachVoiceEnabled ? 'on' : 'off')) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const personaCards = document.querySelectorAll('[data-persona]');
        personaCards.forEach(card => {
            if (card.dataset.persona === this.userPersona) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    saveCoachSettings() {
        const activeVoice = document.querySelector('[data-voice].active')?.dataset.voice;
        const activePersona = document.querySelector('[data-persona].active')?.dataset.persona;

        const oldPersona = this.userPersona;
        this.coachVoiceEnabled = activeVoice === 'on';
        this.userPersona = activePersona || 'male';

        localStorage.setItem('hf-coach-voice', this.coachVoiceEnabled);
        localStorage.setItem('hf-user-persona', this.userPersona);

        window.KINETICS_CAMPAIGN = window.KINETICS_DATA[this.userPersona] || window.KINETICS_DATA.male;
        this.showToast(`Neural Lab updated to ${this.userPersona.toUpperCase()}`, "success");

        if (oldPersona !== this.userPersona) {
            this.currentMissionIndex = 0;
            this.viewingMissionIndex = 0;
            localStorage.setItem('hf-kinetics-level', 0);
            
            if (this.kineticsMode === 'campaign') {
                this.initKineticsCampaign();
            } else {
                this.renderDailyKinetics();
            }
        }
    }

    getCSRFToken() {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, 10) === 'csrftoken=') {
                    cookieValue = decodeURIComponent(cookie.substring(10));
                    break;
                }
            }
        }
        return cookieValue;
    }

    async init() {
        this.validateStateConsistency();
        this.restoreTheme();
        this.restoreBrainDump();
        this.showRandomFortune();
        await this.loadData();
        await this.fetchExercisePresets();
        this.setupListeners();
        this.initSettingsModal();
        this.updateSettingsUI();
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
        document.getElementById('aura-overlay')?.classList.remove('hidden');
        if (!document.querySelector('.aura-breathing')) {
            const breathing = document.createElement('div');
            breathing.className = 'aura-breathing';
            document.body.appendChild(breathing);
        }
        if (!document.getElementById('aura-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'aura-overlay';
            overlay.className = 'aura-overlay';
            document.body.appendChild(overlay);
        }

        // Auto-start audio if a biome is selected
        if (this.currentAudioGenre) {
            this.playAudioForGenre(this.currentAudioGenre);
        }

        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            this.updateFocusTimerDisplay();

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

        this.updateFocusTimerDisplay();
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
        this.updateFocusTimerDisplay();
        this.renderAchievements();

        const sessionsEl = document.getElementById('timer-sessions');
        if (sessionsEl) sessionsEl.textContent = `Sessions: ${this.pomoCount} 🍅`;
        
        // Deactivate Aura Mode on completion
        document.body.classList.remove("aura-active");
    }

    updateFocusTimerDisplay() {
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
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken()
            },
            body: JSON.stringify({ content: el.value })
        }).catch(err => console.warn("Backend impulse save failed, using local only."));
    }

    // ─── BURNOUT SHIELD ───
    async toggleVacationMode() {
        try {
            const response = await fetch('/api/vacation/toggle/', { 
                method: 'POST',
                headers: { 'X-CSRFToken': this.getCSRFToken() }
            });
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
        // Mission / Kinetics Controls
        document.getElementById('restless-toggle-btn')?.addEventListener('click', () => this.toggleRestlessMode());
        document.getElementById('restless-start-btn')?.addEventListener('click', () => this.toggleRestlessRun());
        document.getElementById('mission-pause-btn')?.addEventListener('click', () => this.toggleMissionPause());
        document.getElementById('mission-restart-btn')?.addEventListener('click', () => this.restartMissionExercise());
        document.getElementById('toggle-3d-btn')?.addEventListener('click', () => this.toggleKinetics3D());
        document.getElementById('tree-stage')?.addEventListener('click', () => this.onTreeClick());

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
            this.switchTab('rituals');
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
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
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
            const response = await fetch(`/api/quests/complete/${id}/`, { 
                method: 'POST',
                headers: { 'X-CSRFToken': this.getCSRFToken() }
            });
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
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({ content })
            });
            // Water the tree
            const response = await fetch('/api/tree/water/', { 
                method: 'POST',
                headers: { 'X-CSRFToken': this.getCSRFToken() }
            });
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
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken()
            },
            body: JSON.stringify({ energy: energyMap[state] })
        });

        this.render();
    }

    async initHealthyWeek() {
        try {
            const response = await fetch('/api/seed-healthy-week/', { 
                method: 'POST',
                headers: { 'X-CSRFToken': this.getCSRFToken() }
            });
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
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
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
            const response = await fetch(`/api/todos/toggle/${id}/`, { 
                method: 'POST',
                headers: { 'X-CSRFToken': this.getCSRFToken() }
            });
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
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
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
            const response = await fetch(`/api/habits/complete/${id}/`, { 
                method: 'POST',
                headers: { 'X-CSRFToken': this.getCSRFToken() }
            });
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
        
        // Audio Polish: Speak success/highlights
        if (!this.restlessActive && (type === 'success' || message.includes('XP') || message.includes('LEVEL'))) {
            this.speak(message.split('.')[0]);
        }

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    speak(text, options = {}) {
        if (!this.coachVoiceEnabled || !this.speechSynth || !text) return;
        const { interrupt = false, rate = 0.92, pitch = 1.0, volume = 0.9 } = options;
        
        // If we are already speaking a long form wisdom, don't interrupt unless it is an urgent command
        if (this.speechSynth.speaking && !interrupt) return;
        
        if (interrupt) this.speechSynth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = this.speechSynth.getVoices();
        
        // Prefer natural sounding voices
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) 
                            || voices.find(v => v.name.includes('Natural'))
                            || voices.find(v => v.lang.startsWith('en'))
                            || voices[0];
        
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = rate; // Slightly slower for empathy
        utterance.pitch = pitch;
        utterance.volume = volume;
        
        this.speechSynth.speak(utterance);
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
                    <div class="quest-card ${q.is_completed ? 'completed' : ''}" ${q.is_completed ? '' : `onclick="window.app.completeQuest(${q.id})"`}>
                        <span class="quest-cat">${q.category}</span>
                        <h4>${q.title}</h4>
                        <p class="muted small">${q.description}</p>
                        <span class="quest-reward">+${q.essence_reward} ✨</span>
                        ${q.is_completed ? '<span class="badge secondary small" style="position:absolute; bottom:12px; right:12px;">DONE</span>' : ''}
                    </div>
                `).join('') || '<p class="muted small">No quests active today.</p>';
            }

            // Render new features
            this.renderKinetics();
            this.renderHistory();
            this.renderAchievements();
            this.updateFocusTimerDisplay();
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
            const response = await fetch(`/api/rewards/redeem/${id}/`, { 
                method: 'POST',
                headers: { 'X-CSRFToken': this.getCSRFToken() }
            });
            if (response.ok) {
                card?.classList.add('unlocking');
                if (window.particles) {
                    window.particles.burst(window.innerWidth / 2, window.innerHeight / 2, 'var(--lavender)');
                }

                // Specifically handle Glitch Theme activation
                if (rewardName === 'Glitch Theme') {
                    document.body.classList.remove('brutal', 'glitch');
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
                this.showToast(data.msg || "Insufficient essence!", 'error');
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
        if (mode !== 'campaign') {
            this.stopMissionExercise({ resetRestless: true, keepStage: true });
        }
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
        if (!this.kineticsFallback && typeof window.KineticsFallback2D === 'function') {
            this.kineticsFallback = new window.KineticsFallback2D('mission-fallback-canvas');
        }
        setTimeout(() => {
            const mission = window.KINETICS_CAMPAIGN[this.currentMissionIndex];
            const previewExercise = mission?.exercises.find(ex => !this.completedMissionExercises.includes(ex.id)) || mission?.exercises?.[0] || null;
            if (previewExercise && this.kinetics3D && !this.kinetics3D.renderUnavailable) {
                this.kinetics3D.setAnimation(previewExercise.anim);
            }
            if (previewExercise && this.kineticsFallback) {
                this.kineticsFallback.setAnimation(previewExercise.anim);
                this.kineticsFallback.refresh();
            }
            this.kinetics3D?.resize();
            this.updateMissionDemo(previewExercise?.anim || 'generic', previewExercise || null);
        }, 50);
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

    setRestlessVoiceLine(text) {
        this.restlessVoiceLine = text || (this.speechSynth ? 'Voice guide ready' : 'Voice unavailable');
        const voiceState = document.getElementById('restless-voice-state');
        if (voiceState) voiceState.textContent = this.restlessVoiceLine;
    }

    resetMissionNarrationState() {
        this.missionNarrationState = {
            halfwaySpoken: false,
            tenSecondSpoken: false
        };
    }

    getUpcomingRestlessExercise() {
        const mission = window.KINETICS_CAMPAIGN[this.viewingMissionIndex];
        if (!mission) return null;
        if (this.restlessActive && this.restlessQueue.length) {
            return mission.exercises.find(ex => ex.id === this.restlessQueue[0]) || null;
        }
        return this.getMissionPreviewExercise();
    }

    NARRATIVE_VAULT = {
        intros: [
            "Hey. Let's tackle {name} together for {seconds} seconds. {wisdom} {technique}",
            "I'm ready when you are. {name} today is about {wisdom}. {technique} {seconds} seconds on the clock.",
            "Let's make this session count with some {name}. Remember: {wisdom} {technique} Let's go for {seconds}."
        ],
        halfway: [
            "Halfway through these {name}. You're consistent, and that's what counts. Keep that rhythm.",
            "That's half the time already. You're looking strong on the {name}. Stay with me.",
            "Midpoint reached. The {name} are working. Breathe through the effort."
        ],
        final: [
            "Final ten seconds of {name}. You've got this. Finish clean, stay focused.",
            "Ten left. This is where the growth happens. Own these last reps of {name}.",
            "Final push. Ten seconds. I'm right here with you."
        ],
        recovery: [
            "Beautiful work. Take a deep breath. You have {rest} seconds to recharge. Use them well. Up next, we have {next}.",
            "Rest and reset. {rest} seconds of recovery for you. Think about your focus. Next up: {next}.",
            "Great set. Shake it out. You've earned this {rest} second break. Next, we prepare for {next}."
        ]
    };

    getRandomPhrase(key, variables = {}) {
        const pool = this.NARRATIVE_VAULT[key];
        let phrase = pool[Math.floor(Math.random() * pool.length)];
        for (const [v, val] of Object.entries(variables)) {
            phrase = phrase.replace(new RegExp(`\\{${v}\\}`, 'g'), val);
        }
        return phrase;
    }

    getExerciseWisdom(anim) {
        const wisdom = {
            'pushup': {
                why: 'Push-ups build more than just strength; they build the resolve to push through resistance in your life.',
                how: 'Keep your elbows tucked at a 45-degree angle to protect your shoulders.'
            },
            'squat': {
                why: 'Squats ground your energy. They remind us that true power starts with a stable foundation.',
                how: 'Drive through your heels and keep your chest proud.'
            },
            'plank': {
                why: 'The plank is about stillness under pressure. It teaches your mind to stay calm while the body works.',
                how: 'Keep your core braced and don\'t let your hips sag.'
            },
            'crunch': {
                why: 'Core work is about finding your center. A strong center helps you navigate the chaos of the day.',
                how: 'Focus on pulling your ribs toward your hips, not your neck.'
            },
            'jump': {
                why: 'Explosivity reminds us that we have the power to rise above any obstacle when we commit.',
                how: 'Land softly on the balls of your feet to protect your joints.'
            },
            'dead_bug': {
                why: 'Coordination under tension. It teaches the core and limbs to work in perfect, quiet harmony.',
                how: 'Keep your lower back glued to the floor at all times.'
            },
            'clamshell': {
                why: 'Stability starts in the hips. This is about building the foundation of every step you take.',
                how: 'Only open as far as you can without rolling your hips back.'
            },
            'bird_dog': {
                why: 'Balance is a lifelong practice. This movement aligns the spine and centers the mind.',
                how: 'Keep your neck neutral, looking at the floor between your hands.'
            },
            'heel_tap': {
                why: 'Deep core awareness helps us breathe behind the brace.',
                how: 'Reach firmly for your heels while keeping your belly button pulled in.'
            },
            'punch': {
                why: 'Release the stress. Every punch is a focus point for your intent.',
                how: 'Snap the punches back quickly, as if touching a hot surface.'
            },
            'generic': {
                why: 'This movement is a gift to your future self. Pure, intentional progress.',
                how: 'Focus on a controlled tempo and steady breathing.'
            }
        };
        return wisdom[anim] || wisdom['generic'];
    }

    buildRestlessIntro(exercise, seconds) {
        if (!exercise) return "I'm ready when you are. Let's start with a breath.";
        const wisdom = this.getExerciseWisdom(exercise.anim);
        return this.getRandomPhrase('intros', {
            name: exercise.name,
            seconds: seconds,
            wisdom: wisdom.why,
            technique: wisdom.how
        });
    }

    buildRestlessMidSetPrompt(exercise) {
        if (!exercise) return "You're doing great. Stay with it.";
        return this.getRandomPhrase('halfway', { name: exercise.name });
    }

    buildRestlessFinalPrompt(exercise) {
        if (!exercise) return "Final ten seconds. I'm right here with you. Finish strong.";
        return this.getRandomPhrase('final', { name: exercise.name });
    }

    buildRestlessRecoveryPrompt(restSeconds, nextExercise) {
        const nextName = nextExercise?.name || 'your next movement';
        return this.getRandomPhrase('recovery', {
            rest: restSeconds,
            next: nextName
        });
    }

    showRecoveryHUD(restSeconds, nextExercise) {
        const overlay = document.getElementById('recovery-hud-overlay');
        const timer = document.getElementById('recovery-timer-display');
        const nextTitle = document.getElementById('recovery-next-title');
        const mediaWrap = document.getElementById('mission-media-wrap');

        if (overlay && timer && nextTitle) {
            nextTitle.textContent = nextExercise?.name || 'Next Movement';
            timer.textContent = restSeconds;
            overlay.classList.remove('hidden');
            if (mediaWrap) mediaWrap.classList.add('in-recovery');
        }
        
        // Ensure the preview GIF is updated for the next exercise
        if (nextExercise) {
            this.updateMissionDemo(nextExercise.anim, nextExercise);
        }
    }

    hideRecoveryHUD() {
        const overlay = document.getElementById('recovery-hud-overlay');
        const mediaWrap = document.getElementById('mission-media-wrap');
        if (overlay) overlay.classList.add('hidden');
        if (mediaWrap) mediaWrap.classList.remove('in-recovery');
    }

    toggleRestlessMode(forceValue) {
        const nextValue = typeof forceValue === 'boolean' ? forceValue : !this.restlessModeEnabled;
        this.restlessModeEnabled = nextValue;
        localStorage.setItem('hf-kinetics-restless-mode', String(nextValue));
        if (!nextValue && this.restlessActive) {
            this.stopMissionExercise({ resetRestless: true });
            this.showToast('Restless mode stopped. Back to manual control.', 'info');
        }
        if (!nextValue) {
            this.setRestlessVoiceLine(this.speechSynth ? 'Voice guide ready' : 'Voice unavailable');
        } else {
            this.setRestlessVoiceLine(this.speechSynth ? 'Voice guide armed' : 'Voice unavailable');
        }
        this.updateRestlessUI();
    }

    toggleRestlessRun(startExerciseId = null) {
        if (this.restlessActive) {
            this.stopMissionExercise({ resetRestless: true });
            this.showToast('Restless run stopped.', 'info');
            return;
        }

        if (!this.restlessModeEnabled) {
            this.toggleRestlessMode(true);
        }

        const mission = window.KINETICS_CAMPAIGN[this.viewingMissionIndex];
        if (!mission) return;

        const startExercise = startExerciseId
            ? mission.exercises.find(ex => ex.id === startExerciseId)
            : (mission.exercises.find(ex => !this.completedMissionExercises.includes(ex.id)) || mission.exercises[0]);

        if (!startExercise) {
            this.showToast('This mission is already complete.', 'info');
            this.updateRestlessUI();
            return;
        }

        this.restlessQueue = this.buildRestlessQueue(startExercise.id);
        this.restlessActive = this.restlessQueue.length > 0;
        this.updateRestlessUI();
        if (this.restlessActive) {
            this.startMissionExercise(
                startExercise.id,
                startExercise.anim,
                startExercise.name,
                startExercise.xp,
                startExercise.essence,
                startExercise.ui.color,
                this.getMissionExerciseDuration(startExercise)
            );
        }
    }

    updateRestlessUI() {
        const toggleBtn = document.getElementById('restless-toggle-btn');
        const startBtn = document.getElementById('restless-start-btn');
        const statusPill = document.getElementById('restless-status-pill');
        const nextUp = document.getElementById('restless-next-up');
        const nextExercise = this.getUpcomingRestlessExercise();

        if (toggleBtn) {
            toggleBtn.textContent = this.restlessModeEnabled ? '🦾 Mode: Auto' : '🦾 Mode: Manual';
            toggleBtn.classList.toggle('active', this.restlessModeEnabled);
        }

        if (startBtn) {
            startBtn.textContent = this.restlessActive ? 'Stop circuit' : 'Initiate sequence';
            startBtn.classList.toggle('primary', !this.restlessActive);
        }

        if (statusPill) {
            statusPill.textContent = this.restlessActive ? 'In Circuit' : (this.restlessModeEnabled ? 'Armed' : 'Staged');
        }

        if (nextUp) {
            nextUp.textContent = nextExercise ? `Next: ${nextExercise.name}` : 'Mission Complete';
        }

        this.setRestlessVoiceLine(this.restlessVoiceLine);
    }

    buildRestlessQueue(startExerciseId) {
        const mission = window.KINETICS_CAMPAIGN[this.viewingMissionIndex];
        if (!mission) return [];
        const startIndex = Math.max(0, mission.exercises.findIndex(ex => ex.id === startExerciseId));
        return mission.exercises
            .slice(startIndex)
            .filter(ex => !this.completedMissionExercises.includes(ex.id))
            .map(ex => ex.id);
    }

    getMissionExerciseDuration(exercise) {
        if (!exercise) return 30;
        return parseInt(exercise.seconds, 10) || 30;
    }

    getMissionRestDuration(exercise) {
        if (!exercise) return 15;
        if (exercise.restSeconds !== undefined) {
            return parseInt(exercise.restSeconds, 10) || 15;
        }
        const match = String(exercise.rest || '').match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 15;
    }

    getMissionPreviewExercise() {
        const mission = window.KINETICS_CAMPAIGN[this.viewingMissionIndex];
        if (!mission) return null;
        return mission.exercises.find(ex => !this.completedMissionExercises.includes(ex.id)) || mission.exercises[0] || null;
    }

    clearMissionTimers() {
        if (this.missionTimer) clearInterval(this.missionTimer);
        if (this.missionPrepTimer) clearInterval(this.missionPrepTimer);
        this.missionTimer = null;
        this.missionPrepTimer = null;
    }

    validateStateConsistency() {
        console.log("Portal Audit: Verifying state integrity...");
        if (!Array.isArray(this.completedMissionExercises)) {
            console.warn("Audit: Corrupted exercise state detected. Resetting.");
            this.completedMissionExercises = [];
            localStorage.setItem('hf-kinetics-done', '[]');
        }
        if (this.currentMissionIndex < 0 || this.currentMissionIndex >= window.KINETICS_CAMPAIGN.length) {
            console.warn("Audit: Resetting out-of-bounds mission index.");
            this.currentMissionIndex = 0;
            localStorage.setItem('hf-kinetics-level', 0);
        }
        console.log("Portal Audit: Integrity verified.");
    }

    switchTab(tabId) {
        document.querySelectorAll('.main-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        document.querySelectorAll('.tab-view').forEach(view => {
            view.classList.add('hidden');
        });
        
        const libraryModal = document.getElementById('library-modal-overlay');
        const targetView = tabId === 'rituals' ? 'rituals-view' : 'kinetics-view';
        if (tabId === 'library') {
            document.getElementById('rituals-view').classList.remove('hidden');
            this.showRitualLibrary();
        } else {
            const app = document.getElementById('app');
            if (app) {
                app.classList.toggle('mode-immersive', tabId === 'kinetics');
            }

            libraryModal?.classList.add('hidden');
            document.getElementById(targetView)?.classList.remove('hidden');
        }

        // Professional Resource Management: Pause 3D canvas when invisible
        if (this.kinetics3D) {
            if (tabId === 'kinetics') {
                setTimeout(() => this.kinetics3D.resize(), 50);
                this.kinetics3D.shouldPause = false; // Add this flag to 3D engine if possible
            } else {
                this.kinetics3D.shouldPause = true;
            }
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
                <div class="exercise-card glass energy-${ex.energy}">
                    <div class="exercise-card-top">
                        <span class="exercise-icon">${ex.icon}</span>
                        <span class="badge secondary small">${ex.energy} energy</span>
                    </div>
                    <h3>${ex.name}</h3>
                    <p class="exercise-desc">${ex.desc}</p>
                    <div class="exercise-metrics">
                        <div class="exercise-metric">
                            <span class="exercise-metric-label">Reward</span>
                            <span class="exercise-metric-value">${ex.reward} ✨</span>
                        </div>
                        <div class="exercise-metric">
                            <span class="exercise-metric-label">Mode</span>
                            <span class="exercise-metric-value">Daily Sync</span>
                        </div>
                    </div>
                    <div class="card-actions exercise-actions">
                        <button class="primary-btn small exercise-complete-btn" onclick="window.app.completeExercise('${ex.name}', ${ex.reward})">Mark Complete</button>
                    </div>
                </div>
            `).join('');
        } else {
            grid.classList.add('hidden');
            campaign.classList.remove('hidden');
            this.renderCampaign();
        }
    }

    async completeExercise(name, reward) {
        try {
            const response = await fetch('/api/exercises/complete/', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({ name, reward })
            });

            if (!response.ok) {
                throw new Error('Exercise completion failed');
            }

            await this.loadData();
            this.render();
            this.showToast(`Kinetics synced: ${name} complete. +${reward} ✨`, 'success');

            if (window.particles) {
                window.particles.burst(window.innerWidth / 2, window.innerHeight / 2, 'rgb(96, 165, 250)');
            }
        } catch (error) {
            console.error('Failed to complete exercise:', error);
            this.showToast('Could not save that exercise yet.', 'error');
        }
    }

    renderCampaign() {
        const mission = window.KINETICS_CAMPAIGN[this.viewingMissionIndex];
        if (!mission) return;

        const titleEl = document.getElementById('current-mission-title');
        titleEl.textContent = mission.title;
        titleEl.classList.add('dopamine-pop');
        setTimeout(() => titleEl.classList.remove('dopamine-pop'), 400);

        document.getElementById('current-mission-objective').textContent = mission.objective;
        document.getElementById('mission-tip').textContent = mission.microHabit;
        this.updateRestlessUI();
        this.updateMissionStage({
            status: 'Mission Ready',
            title: mission.title,
            instruction: mission.objective,
            cue: `Cue: ${mission.microHabit}`
        });

        const list = document.getElementById('mission-exercises-list');
        const progress = (this.completedMissionExercises.length / mission.exercises.length) * 100;
        document.getElementById('mission-progress').style.width = progress + '%';

        list.innerHTML = mission.exercises.map(ex => {
            const isDone = this.completedMissionExercises.includes(ex.id);
            return `
                <div class="mission-exercise-card glass ${isDone ? 'done' : ''}" style="border-left: 5px solid ${ex.ui.color}">
                    <div class="ex-info">
                        <div class="exercise-card-top">
                            <span class="badge secondary small">Mission Exercise</span>
                            <span class="badge secondary small">${ex.rest} rest</span>
                        </div>
                        <h4>${ex.name}</h4>
                        <div class="ex-meta">
                            <span class="ex-meta-pill">${ex.sets}</span>
                            <span class="ex-meta-pill">Rest ${ex.rest}</span>
                        </div>
                        <p class="ex-instruction small">${ex.instruction}</p>
                        <div class="ex-cue small"><b>Cue:</b> ${ex.cue}</div>
                        <div class="alt-options tiny">
                            <span>Alt: ${ex.easier}</span>
                        </div>
                    </div>
                    <div class="ex-actions">
                        <div class="xp-reward">+${ex.xp} XP</div>
                        <div class="essence-reward">+${ex.essence} ✨</div>
                        ${isDone ? 
                            `<div class="btn-group-v">
                                <button class="action-trigger-btn secondary" onclick="window.app.startMissionExercise('${ex.id}', '${ex.anim}', '${ex.name}', ${ex.xp}, ${ex.essence}, '${ex.ui.color}', ${this.getMissionExerciseDuration(ex)})">RE-SYNC</button>
                                <span class="badge secondary kinetics-success-badge">COMPLETED</span>
                            </div>` : 
                            `<div class="btn-group-v">
                                <button class="action-trigger-btn" onclick="window.app.startMissionExercise('${ex.id}', '${ex.anim}', '${ex.name}', ${ex.xp}, ${ex.essence}, '${ex.ui.color}', ${this.getMissionExerciseDuration(ex)})">START</button>
                                <button class="minimal-pill-btn" onclick="window.app.completeMissionExercise('${ex.id}', '${ex.name}', ${ex.xp / 2}, ${ex.essence / 2}, '${ex.ui.color}', true)">Minimal Sync</button>
                            </div>`
                        }
                    </div>
                </div>
            `;
        }).join('');

        if (this.completedMissionExercises.length >= mission.exercises.length) {
            // Check if they are viewing the latest mission or a past one
            if (this.viewingMissionIndex === this.currentMissionIndex) {
                list.innerHTML += `
                    <div class="next-level-area glass">
                        <h3>MISSION ACCOMPLISHED 🏆</h3>
                        <p class="small muted">You've mastered this level. Ready to proceed?</p>
                        <button class="primary-btn" onclick="window.app.advanceMission()">Next Level</button>
                    </div>
                `;
            } else {
                list.innerHTML += `
                    <div class="next-level-area glass">
                        <h3>MISSION ACCOMPLISHED 🏆</h3>
                        <p class="small muted">You have already completed this past day's training.</p>
                        <button class="primary-btn" onclick="window.app.nextMission()">View Next Day</button>
                    </div>
                `;
            }
        }

        const previewExercise = this.getMissionPreviewExercise();
        this.updateMissionDemo(previewExercise?.anim || 'generic', previewExercise || null);
        if (this.kinetics3D && previewExercise) {
            this.kinetics3D.intensityBoost = false;
            this.kinetics3D.setAnimation(previewExercise.anim);
        }
    }

    getCurrentMissionExercise(id) {
        const mission = window.KINETICS_CAMPAIGN[this.viewingMissionIndex];
        if (!mission) return null;
        return mission.exercises.find(ex => ex.id === id) || null;
    }

    updateMissionStage({ status, title, instruction, cue }) {
        const statusEl = document.getElementById('mission-stage-status');
        const titleEl = document.getElementById('mission-stage-title');
        const instructionEl = document.getElementById('mission-stage-instruction');
        const cueEl = document.getElementById('mission-stage-cue');

        if (statusEl) statusEl.textContent = status || 'Mission Ready';
        if (titleEl) titleEl.textContent = title || 'Choose an exercise';
        if (instructionEl) instructionEl.textContent = instruction || 'Press START on a mission exercise to see live form guidance here.';
        if (cueEl) cueEl.textContent = cue || 'Cue: Stay controlled and intentional.';
    }

    updateMissionDemo(anim, exercise) {
        const media = document.getElementById('mission-demo-media');
        const mainCanvas = document.getElementById('kinetics-3d-canvas');
        const exerciseTitle = document.getElementById('hud-exercise-title');

        if (exerciseTitle && exercise) {
            exerciseTitle.textContent = exercise.name;
        }

        if (!media) return;

        // Prioritize GIF for reliable visual presence
        const demoData = this.exerciseDemoLibrary[anim] || this.exerciseDemoLibrary['generic'];
        media.src = demoData.src;

        // 3D handling is now secondary/toggleable
        if (this.kinetics3D && !mainCanvas.classList.contains('hidden')) {
            this.kinetics3D.setAnimation(anim);
        }
    }

    toggleKinetics3D() {
        const mainCanvas = document.getElementById('kinetics-3d-canvas');
        const viewer = document.getElementById('mission-demo-viewer');
        if (!mainCanvas || !viewer) return;

        const is3DHidden = mainCanvas.classList.contains('hidden');
        if (is3DHidden) {
            mainCanvas.classList.remove('hidden');
            viewer.classList.add('hidden');
            if (this.kinetics3D) {
                this.kinetics3D.renderUnavailable = false;
                const mission = window.KINETICS_CAMPAIGN[this.viewingMissionIndex];
                const ex = mission?.exercises[0]; // Simple reload for current
                if (ex) this.kinetics3D.setAnimation(ex.anim);
            }
        } else {
            mainCanvas.classList.add('hidden');
            viewer.classList.remove('hidden');
            if (this.kinetics3D) this.kinetics3D.renderUnavailable = true;
        }
    }

    async completeMissionExercise(id, name, xp, essence, color, isMinimal = false) {
        // Redoing is allowed, but we only log it if it wasn't already done in this specific session
        // or we can just allow multiple completions if the user wants to re-do.
        // For ADHD support, multiple "wins" are better than blocking.
        
        try {
            const resp = await fetch('/api/exercises/complete/', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({ name: (isMinimal ? "Minimal: " : "Mission: ") + name, reward: essence })
            });

            if (resp.ok) {
                const exercise = this.getCurrentMissionExercise(id);
                if (!this.completedMissionExercises.includes(id)) {
                    this.completedMissionExercises.push(id);
                }
                localStorage.setItem('hf-kinetics-done', JSON.stringify(this.completedMissionExercises));
                
                this.exerciseHistory = JSON.parse(localStorage.getItem('hf-kinetics-history') || '{}');
                const today = new Date().toISOString().split('T')[0];
                if (!this.exerciseHistory[today]) this.exerciseHistory[today] = [];
                this.exerciseHistory[today].push({ id, name, time: new Date().toLocaleTimeString(), isMinimal });
                localStorage.setItem('hf-kinetics-history', JSON.stringify(this.exerciseHistory));

                const msg = isMinimal ? `✨ ${xp} XP (Minimal Sync). Build that habit!` : `✨ ${xp} XP GAINED. ${name} SYNCED.`;
                this.showToast(msg, isMinimal ? 'info' : 'success');
                
                // Journey Looping Check
                this.checkJourneyProgress();

                const timerDisplay = document.getElementById('mission-timer-display');
                if (timerDisplay) {
                    timerDisplay.classList.add('dopamine-pop');
                    setTimeout(() => timerDisplay.classList.remove('dopamine-pop'), 400);
                }

                if (window.particles) {
                    window.particles.burst(window.innerWidth / 2, window.innerHeight / 2, color);
                }
                
                this.data.focusPoints += Math.floor(xp / 10);
                this.updateMissionStage({
                    status: isMinimal ? 'Minimal Complete' : 'Exercise Complete',
                    title: name,
                    instruction: isMinimal ? 'Minimal version logged. A smaller win still builds momentum.' : 'Excellent work. That set has been synced and counted toward your mission.',
                    cue: isMinimal ? 'Cue: Small reps done consistently still compound.' : 'Cue: Reset your breath and prepare for the next movement.'
                });
                
                if (this.restlessActive && !isMinimal) {
                    this.setRestlessVoiceLine(`Coach confirms ${name} complete`);
                    this.speak(`${name} complete.`, { rate: 1.04 });
                }
                this.render();
                this.renderHistory();
                this.updateRestlessUI();

                if (this.restlessActive && !isMinimal) {
                    this.beginRestlessInterval(exercise);
                } else {
                    this.stopMissionExercise({ resetRestless: isMinimal && this.restlessActive });
                }
            }
        } catch (e) { console.error(e); }
    }

    checkJourneyProgress() {
        const allExerciseIds = window.KINETICS_CAMPAIGN.flatMap(m => m.exercises.map(ex => ex.id));
        const allDone = allExerciseIds.every(id => this.completedMissionExercises.includes(id));
        
        if (allDone) {
            this.showToast('JOURNEY COMPLETE! Re-initiating from Day 1...', 'success');
            setTimeout(() => {
                this.completedMissionExercises = [];
                localStorage.setItem('hf-kinetics-done', JSON.stringify([]));
                this.currentMissionIndex = 0;
                localStorage.setItem('hf-kinetics-level', 0);
                this.viewingMissionIndex = 0;
                this.render();
                this.speak("Journey complete. You have evolved. Re-initiating mission track from day one.", { rate: 0.95 });
            }, 3000);
        }
    }

    async startMissionExercise(id, anim, name, xp, essence, color, seconds) {
        console.log("Starting mission exercise:", id, anim);
        try {
            const exercise = this.getCurrentMissionExercise(id);
            if (!exercise) return;

            this.clearMissionTimers();
            if (!this.kinetics3D) { 
                this.initKinetics3D(); 
                await new Promise(r => setTimeout(r, 100));
            }

            if (this.restlessModeEnabled && !this.completedMissionExercises.includes(id)) {
                this.restlessQueue = this.buildRestlessQueue(id);
                this.restlessActive = this.restlessQueue.length > 0;
            }

            this.currentExerciseParams = { id, anim, name, xp, essence, color, seconds };
            this.resetMissionNarrationState();
            this.missionPaused = false;
            this.updatePauseButtonUI();
            this.setRestlessVoiceLine(`Coach prepping ${exercise.name}`);
            this.updateRestlessUI();

            const timerWrap = document.getElementById('mission-timer-overlay');
            if (timerWrap) timerWrap.classList.remove('hidden');
            this.hideRecoveryHUD();

            if (this.kinetics3D) this.kinetics3D.intensityBoost = false;
            this.updateMissionStage({
                status: 'Get Set',
                title: exercise.name,
                instruction: exercise.instruction,
                cue: `Cue: ${exercise.cue}`
            });
            this.updateMissionDemo(anim, exercise);

            let prep = 3;
            this.updateMissionTimerDisplay(prep, 3);
            
            // Humanized Intro with a small breathe delay
            setTimeout(() => {
                this.speak(this.buildRestlessIntro(exercise, seconds));
            }, 400);

            this.missionPrepTimer = setInterval(() => {
                if (this.missionPaused) return;
                prep--;
                if (prep > 0) {
                    this.updateMissionTimerDisplay(prep, 3);
                    this.setRestlessVoiceLine(`Coach counting in ${exercise.name}`);
                    this.updateMissionStage({
                        status: `Prepare ${prep}`,
                        title: exercise.name,
                        instruction: exercise.instruction,
                        cue: `Cue: ${exercise.cue}`
                    });
                    this.speak(prep.toString());
                    return;
                }

                clearInterval(this.missionPrepTimer);
                this.missionPrepTimer = null;
                this.speak("Go!");
                this.runMissionTimer(id, anim, name, xp, essence, color, seconds);
            }, 1000);
        } catch (e) { console.error("Start mission error:", e); }
    }

    runMissionTimer(id, anim, name, xp, essence, color, seconds) {
        if (this.kinetics3D && !this.kinetics3D.renderUnavailable) { this.kinetics3D.setAnimation(anim); }
        if (this.kineticsFallback) this.kineticsFallback.setAnimation(anim);
        const exercise = this.getCurrentMissionExercise(id);

        this.currentExerciseParams = { id, anim, name, xp, essence, color, seconds };
        this.missionPaused = false;
        this.updatePauseButtonUI();
        this.setRestlessVoiceLine(`Coach live on ${name}`);

        this.missionTimeRemaining = parseInt(seconds) || 30;
        this.missionTotalTime = this.missionTimeRemaining;
        this.updateMissionTimerDisplay();
        if (exercise) {
            const wisdom = this.getExerciseWisdom(exercise.anim);
            this.updateMissionStage({
                status: 'Live Set',
                title: exercise.name,
                instruction: wisdom.how,
                cue: wisdom.why
            });
            this.updateMissionDemo(anim, exercise);
        }

        if (this.missionTimer) clearInterval(this.missionTimer);
        this.missionTimer = setInterval(() => {
            if (this.missionPaused) return;
            
            this.missionTimeRemaining--;
            this.updateMissionTimerDisplay();
            
            // Power Surge: Last 5 seconds muscle glow boost
            if (this.missionTimeRemaining <= 5 && this.kinetics3D) {
                this.kinetics3D.intensityBoost = true;
            }

            // Audio Cue for last 3s
            if (this.missionTimeRemaining <= 3 && this.missionTimeRemaining > 0) {
                this.speak(this.missionTimeRemaining.toString());
            }

            const halfwayMark = Math.max(2, Math.floor(this.missionTotalTime / 2));
            if (this.restlessActive && !this.missionNarrationState.halfwaySpoken && this.missionTimeRemaining === halfwayMark) {
                this.missionNarrationState.halfwaySpoken = true;
                this.setRestlessVoiceLine(`Coach cue: halfway through ${name}`);
                this.speak(this.buildRestlessMidSetPrompt(exercise), { rate: 1.01 });
            }

            if (this.restlessActive && !this.missionNarrationState.tenSecondSpoken && this.missionTimeRemaining === 10) {
                this.missionNarrationState.tenSecondSpoken = true;
                this.setRestlessVoiceLine(`Coach push: final ten on ${name}`);
                this.speak(this.buildRestlessFinalPrompt(exercise));
            }

            if (this.missionTimeRemaining <= 0) {
                clearInterval(this.missionTimer);
                this.missionTimer = null;
                this.completeMissionExercise(id, name, xp, essence, color);
            }
        }, 1000);
    }

    beginRestlessInterval(exercise) {
        if (!exercise) {
            this.stopMissionExercise({ resetRestless: true });
            return;
        }

        this.restlessQueue = this.restlessQueue.filter(queueId => queueId !== exercise.id);
        const mission = window.KINETICS_CAMPAIGN[this.viewingMissionIndex];
        const nextExercise = mission?.exercises.find(ex => ex.id === this.restlessQueue[0]) || null;
        if (!nextExercise) {
            this.stopMissionExercise({ resetRestless: true });
            this.showToast('Restless run complete. Mission synced.', 'success');
            return;
        }

        this.clearMissionTimers();
        this.missionPaused = false;
        this.currentExerciseParams = {
            id: nextExercise.id,
            anim: nextExercise.anim,
            name: nextExercise.name,
            xp: nextExercise.xp,
            essence: nextExercise.essence,
            color: nextExercise.ui.color,
            seconds: this.getMissionExerciseDuration(nextExercise)
        };
        this.updatePauseButtonUI();

        const restSeconds = this.getMissionRestDuration(exercise);
        this.missionTimeRemaining = restSeconds;
        this.missionTotalTime = restSeconds;
        this.updateMissionTimerDisplay(restSeconds, restSeconds);
        
        // Show Pro Recovery HUD
        this.showRecoveryHUD(restSeconds, nextExercise);
        
        this.setRestlessVoiceLine(`Coach recovery. ${nextExercise.name} is next.`);
        this.speak(this.buildRestlessRecoveryPrompt(restSeconds, nextExercise), { rate: 0.98 });

        this.missionTimer = setInterval(() => {
            if (this.missionPaused) return;

            this.missionTimeRemaining--;
            this.updateMissionTimerDisplay();
            
            // Update Recovery HUD Timer
            const recoveryTimer = document.getElementById('recovery-timer-display');
            if (recoveryTimer) recoveryTimer.textContent = this.missionTimeRemaining;

            if (this.missionTimeRemaining <= 3 && this.missionTimeRemaining > 0) {
                this.speak(this.missionTimeRemaining.toString(), { interrupt: true });
            }

            if (this.missionTimeRemaining <= 0) {
                clearInterval(this.missionTimer);
                this.missionTimer = null;
                this.hideRecoveryHUD();
                this.startMissionExercise(
                    nextExercise.id,
                    nextExercise.anim,
                    nextExercise.name,
                    nextExercise.xp,
                    nextExercise.essence,
                    nextExercise.ui.color,
                    this.getMissionExerciseDuration(nextExercise)
                );
            }
        }, 1000);
    }

    stopMissionExercise(options = {}) {
        const { resetRestless = false, keepStage = false } = options;
        this.clearMissionTimers();
        this.missionTimeRemaining = 0;
        this.missionTotalTime = 0;
        this.missionPaused = false;
        this.currentExerciseParams = null;
        document.getElementById('mission-timer-overlay')?.classList.add('hidden');
        const previewExercise = this.getMissionPreviewExercise();
        this.updateMissionDemo(previewExercise?.anim || 'generic', previewExercise);
        if (this.kinetics3D && !this.kinetics3D.renderUnavailable) {
            this.kinetics3D.intensityBoost = false;
            this.kinetics3D.setAnimation(previewExercise?.anim || null);
        }
        if (this.kineticsFallback) this.kineticsFallback.setAnimation(previewExercise?.anim || 'breathe');
        if (resetRestless) {
            this.restlessActive = false;
            this.restlessQueue = [];
        }
        this.resetMissionNarrationState();
        this.updatePauseButtonUI();
        this.setRestlessVoiceLine(
            resetRestless
                ? (this.speechSynth ? 'Voice guide ready' : 'Voice unavailable')
                : this.restlessVoiceLine
        );
        this.updateRestlessUI();
        if (!keepStage) {
            const mission = window.KINETICS_CAMPAIGN[this.viewingMissionIndex];
            if (mission) {
                this.updateMissionStage({
                    status: 'Mission Ready',
                    title: mission.title,
                    instruction: mission.objective,
                    cue: `Cue: ${mission.microHabit}`
                });
            }
        }
    }

    toggleMissionPause() {
        if (!this.missionTimer && !this.missionPrepTimer) return;
        this.missionPaused = !this.missionPaused;
        this.updatePauseButtonUI();
        if (this.missionPaused) {
            this.speak("Just taking a moment to breathe. I'll wait for you.");
            this.setRestlessVoiceLine("Coach paused... waiting for you");
        } else {
            this.speak("Ready when you are. Resuming.");
            this.setRestlessVoiceLine("Coach live again");
        }
    }

    updatePauseButtonUI() {
        const btn = document.getElementById('mission-pause-btn');
        if (btn) {
            btn.querySelector('.icon').textContent = this.missionPaused ? '▶️' : '⏸️';
            btn.title = this.missionPaused ? 'Resume Mission' : 'Pause Mission';
        }
    }

    restartMissionExercise() {
        if (!this.currentExerciseParams) return;
        this.speak("No problem at all. Let's reset and start this one fresh.");
        this.startMissionExercise(this.currentExerciseParams.id, this.currentExerciseParams.anim, this.currentExerciseParams.name, this.currentExerciseParams.xp, this.currentExerciseParams.essence, this.currentExerciseParams.color, this.currentExerciseParams.seconds);
    }

    onTreeClick() {
        if (window.particles) {
            window.particles.burst(window.innerWidth / 2, window.innerHeight / 2, '#4ade80');
        }
        this.showToast(`The Evolution Tree is at Stage ${this.data.treeStage + 1}. Keep growing!`, 'success');
        
        // Mini "growth" animation
        const visual = document.querySelector('.tree-visual');
        if (visual) {
            visual.style.transform = 'scale(1.4)';
            setTimeout(() => visual.style.transform = 'scale(1)', 300);
        }
    }

    prevHistoryDate() {
        const d = new Date(this.historyViewDate);
        d.setDate(d.getDate() - 1);
        this.historyViewDate = d.toISOString().split('T')[0];
        this.renderHistory();
    }

    nextHistoryDate() {
        const d = new Date(this.historyViewDate);
        d.setDate(d.getDate() + 1);
        this.historyViewDate = d.toISOString().split('T')[0];
        this.renderHistory();
    }

    renderHistory() {
        const historyContainer = document.getElementById('mission-history-list');
        const dateDisplay = document.getElementById('history-current-date');
        if (!historyContainer || !dateDisplay) return;

        const today = new Date().toISOString().split('T')[0];
        dateDisplay.textContent = this.historyViewDate === today ? 'Today' : this.historyViewDate;

        const exercises = this.exerciseHistory[this.historyViewDate] || [];
        if (exercises.length === 0) {
            historyContainer.innerHTML = '<p class="muted small text-center">No activity recorded for this date.</p>';
            return;
        }

        historyContainer.innerHTML = `
            <div class="history-day glass">
                <div class="history-items">
                    ${exercises.map(ex => `
                        <div class="history-item">
                            <span class="history-icon">${ex.isMinimal ? '⚡' : '🔥'}</span>
                            <span class="history-name">${ex.name}</span>
                            <span class="history-time muted small">${ex.time}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    updateMissionTimerDisplay(current = this.missionTimeRemaining, total = this.missionTotalTime) {
        const display = document.getElementById('mission-timer-display');
        const fill = document.getElementById('timer-ring-fill');
        if (!display || !fill) return;

        display.textContent = Math.ceil(current);
        
        // Ring offset calculation
        const circumference = 339.292;
        const progress = current / total;
        const offset = circumference - (progress * circumference);
        fill.style.strokeDashoffset = offset;
    }

    advanceMission() {
        if (this.currentMissionIndex < window.KINETICS_CAMPAIGN.length - 1) {
            this.stopMissionExercise({ resetRestless: true, keepStage: true });
            this.currentMissionIndex++;
            this.viewingMissionIndex = this.currentMissionIndex;
            localStorage.setItem('hf-kinetics-level', this.currentMissionIndex);
            this.completedMissionExercises = [];
            localStorage.setItem('hf-kinetics-done', JSON.stringify([]));
            this.render();
            window.scrollTo(0, 0);
            this.showToast('Level Up! New mission available.', 'success');
        } else {
            this.showToast('You have conquered all current missions. Respect.', 'success');
        }
    }

    prevMission() {
        if (this.viewingMissionIndex > 0) {
            this.stopMissionExercise({ resetRestless: true, keepStage: true });
            this.viewingMissionIndex--;
            this.renderCampaign();
        }
    }

    nextMission() {
        if (this.viewingMissionIndex < this.currentMissionIndex) {
            this.stopMissionExercise({ resetRestless: true, keepStage: true });
            this.viewingMissionIndex++;
            this.renderCampaign();
        }
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
