class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('dopamine-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    burst(x, y, color) {
        // Cheerful colors palette
        const cheerfulColors = [
            'rgb(251, 191, 36)',   // sun gold
            'rgb(251, 113, 133)',  // coral
            'rgb(52, 211, 153)',   // mint
            'rgb(96, 165, 250)',   // sky blue
            'rgb(192, 132, 252)',  // lavender
            'rgb(251, 146, 60)',   // peach
        ];

        for (let i = 0; i < 40; i++) {
            const c = cheerfulColors[Math.floor(Math.random() * cheerfulColors.length)];
            const angle = (Math.PI * 2 * i) / 40 + Math.random() * 0.5;
            const speed = Math.random() * 8 + 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: Math.random() * 5 + 2,
                color: c,
                life: 1.0,
                decay: Math.random() * 0.015 + 0.008,
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08;
            p.vx *= 0.99;
            p.life -= p.decay;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color.replace('rgb', 'rgba').replace(')', `, ${p.life})`);
            this.ctx.fill();

            // Glow effect
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life * 2.5, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color.replace('rgb', 'rgba').replace(')', `, ${p.life * 0.15})`);
            this.ctx.fill();
        }

        requestAnimationFrame(() => this.animate());
    }
}

window.particles = new ParticleSystem();
