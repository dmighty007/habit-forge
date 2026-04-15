class KineticsFallback2D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.currentAnim = 'breathe';
        this.elapsed = 0;
        this.delta = 1 / 60;
        this.lastTime = performance.now();
        this.running = true;
        this.rafId = null;
        this.wasHidden = false;
        this.poseValues = {};
        this.poseVelocity = {};
        window.addEventListener('resize', () => this.resize());
        document.addEventListener('visibilitychange', () => {
            this.lastTime = performance.now();
        });
        this.resize();
        this.animate();
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
        this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    setAnimation(type) {
        this.currentAnim = type || 'breathe';
        this.lastTime = performance.now();
        this.resize();
    }

    refresh() {
        this.lastTime = performance.now();
        this.resize();
    }

    animate() {
        if (!this.running || !this.ctx) return;
        this.rafId = requestAnimationFrame(() => this.animate());
        const now = performance.now();
        const delta = Math.min(0.05, (now - this.lastTime) / 1000);
        this.lastTime = now;
        this.delta = delta;
        const rect = this.canvas.getBoundingClientRect();
        const hiddenNow = rect.width < 4 || rect.height < 4;
        if (hiddenNow) {
            this.wasHidden = true;
            return;
        }
        if (this.wasHidden) {
            this.resize();
            this.wasHidden = false;
        }
        this.elapsed += delta;
        this.draw();
    }

    springValue(key, target, dt, stiffness = 180, damping = 22) {
        const current = this.poseValues[key] ?? target;
        const velocity = this.poseVelocity[key] ?? 0;
        const accel = (target - current) * stiffness - velocity * damping;
        const nextVelocity = velocity + accel * dt;
        const nextValue = current + nextVelocity * dt;
        this.poseValues[key] = nextValue;
        this.poseVelocity[key] = nextVelocity;
        return nextValue;
    }

    phaseWave(time, speed = 1, downRatio = 0.44, holdBottom = 0.08, holdTop = 0.12) {
        const cycle = (time * speed) % 1;
        if (cycle < holdTop) return 0;
        if (cycle < holdTop + downRatio) {
            return easeInOut((cycle - holdTop) / downRatio);
        }
        if (cycle < holdTop + downRatio + holdBottom) return 1;
        const upDuration = Math.max(0.01, 1 - holdTop - downRatio - holdBottom);
        return 1 - easeInOut((cycle - holdTop - downRatio - holdBottom) / upDuration);
    }

    alternatingWave(time, speed = 1) {
        return Math.sin(time * speed * Math.PI * 2);
    }

    buildPoseTargets(width, height, time) {
        const centerX = width * 0.58;
        const baseY = height * 0.82;
        const rep = this.phaseWave(time, 0.42);
        const brisk = this.phaseWave(time, 0.72, 0.34, 0.04, 0.08);
        const alt = this.alternatingWave(time, 0.64);
        const jackOpen = this.phaseWave(time, 0.92, 0.3, 0.03, 0.08);
        const breath = (Math.sin(time * 2.1) + 1) / 2;

        const pose = {
            rootX: centerX,
            rootY: baseY - 96,
            torsoAngle: -Math.PI / 2,
            headOffsetX: 0,
            headOffsetY: -18,
            leftUpperArm: 1.8,
            leftForeArm: 1.65,
            rightUpperArm: 1.55,
            rightForeArm: 1.45,
            leftUpperLeg: 1.48,
            leftLowerLeg: 1.56,
            rightUpperLeg: 1.66,
            rightLowerLeg: 1.58,
            haloPulse: breath,
            shadowW: 54,
            shadowH: 11
        };

        switch (this.currentAnim) {
        case 'pushup':
            pose.rootX = centerX - 18;
            pose.rootY = baseY - 12 - rep * 16;
            pose.torsoAngle = -0.08;
            pose.headOffsetX = 10;
            pose.headOffsetY = -4;
            pose.leftUpperArm = 1.08 + rep * 0.7;
            pose.leftForeArm = 0.52 + rep * 0.6;
            pose.rightUpperArm = 1.08 + rep * 0.7;
            pose.rightForeArm = 0.52 + rep * 0.6;
            pose.leftUpperLeg = -0.08;
            pose.leftLowerLeg = -0.04;
            pose.rightUpperLeg = 0.06;
            pose.rightLowerLeg = 0.02;
            pose.shadowW = 74;
            pose.shadowH = 9;
            break;
        case 'pushup_incline':
            pose.rootX = centerX - 8;
            pose.rootY = baseY - 40 - rep * 12;
            pose.torsoAngle = -0.46;
            pose.headOffsetX = 8;
            pose.headOffsetY = -8;
            pose.leftUpperArm = 1.18 + rep * 0.45;
            pose.leftForeArm = 0.74 + rep * 0.35;
            pose.rightUpperArm = 1.18 + rep * 0.45;
            pose.rightForeArm = 0.74 + rep * 0.35;
            pose.leftUpperLeg = 0.2;
            pose.leftLowerLeg = 0.18;
            pose.rightUpperLeg = 0.34;
            pose.rightLowerLeg = 0.28;
            pose.shadowW = 66;
            pose.shadowH = 10;
            break;
        case 'squat':
            pose.rootY = baseY - 96 + rep * 28;
            pose.rootX = centerX - rep * 7;
            pose.torsoAngle = -Math.PI / 2 + rep * 0.32;
            pose.leftUpperArm = 1.7 + rep * 0.32;
            pose.leftForeArm = 1.46 + rep * 0.16;
            pose.rightUpperArm = 1.44 + rep * 0.26;
            pose.rightForeArm = 1.34 + rep * 0.18;
            pose.leftUpperLeg = 1.18 + rep * 0.64;
            pose.leftLowerLeg = 1.62 - rep * 0.82;
            pose.rightUpperLeg = 1.96 - rep * 0.64;
            pose.rightLowerLeg = 1.52 + rep * 0.74;
            pose.shadowW = 58 + rep * 10;
            pose.shadowH = 12 + rep * 2;
            break;
        case 'lunge':
            pose.rootX = centerX - 12 + alt * 10;
            pose.rootY = baseY - 92 + rep * 18;
            pose.torsoAngle = -Math.PI / 2 + 0.16;
            pose.leftUpperArm = 1.66 - alt * 0.14;
            pose.leftForeArm = 1.48 - alt * 0.1;
            pose.rightUpperArm = 1.42 + alt * 0.14;
            pose.rightForeArm = 1.34 + alt * 0.1;
            pose.leftUpperLeg = 1.1 + rep * 0.72;
            pose.leftLowerLeg = 1.56 - rep * 0.88;
            pose.rightUpperLeg = 1.92 - rep * 0.46;
            pose.rightLowerLeg = 1.54 + rep * 0.36;
            pose.shadowW = 66;
            pose.shadowH = 11;
            break;
        case 'plank':
            pose.rootX = centerX - 10;
            pose.rootY = baseY - 20 - breath * 4;
            pose.torsoAngle = -0.1;
            pose.headOffsetX = 10;
            pose.headOffsetY = -4;
            pose.leftUpperArm = 0.92;
            pose.leftForeArm = 1.46;
            pose.rightUpperArm = 0.92;
            pose.rightForeArm = 1.46;
            pose.leftUpperLeg = -0.04;
            pose.leftLowerLeg = -0.02;
            pose.rightUpperLeg = 0.08;
            pose.rightLowerLeg = 0.03;
            pose.shadowW = 72;
            pose.shadowH = 9;
            break;
        case 'leg_raise':
            pose.rootX = centerX + 6;
            pose.rootY = baseY - 22;
            pose.torsoAngle = Math.PI / 2.06;
            pose.headOffsetX = -10;
            pose.headOffsetY = 4;
            pose.leftUpperArm = 4.05;
            pose.leftForeArm = 4.26;
            pose.rightUpperArm = 5.34;
            pose.rightForeArm = 5.1;
            pose.leftUpperLeg = -1.72 + rep * 1.08;
            pose.leftLowerLeg = -1.52 + rep * 0.92;
            pose.rightUpperLeg = -1.58 + rep * 1.02;
            pose.rightLowerLeg = -1.42 + rep * 0.86;
            pose.shadowW = 70;
            pose.shadowH = 8;
            break;
        case 'curl':
            pose.rootY = baseY - 96;
            pose.leftUpperArm = 1.68;
            pose.leftForeArm = 1.08 - brisk * 1.28;
            pose.rightUpperArm = 1.46;
            pose.rightForeArm = 1.96 + brisk * 1.28;
            break;
        case 'stretch':
            pose.rootY = baseY - 98 + breath * 4;
            pose.torsoAngle = -Math.PI / 2 - 0.04;
            pose.leftUpperArm = 3.92 - breath * 0.36;
            pose.leftForeArm = 4.28 - breath * 0.18;
            pose.rightUpperArm = -0.76 + breath * 0.36;
            pose.rightForeArm = -0.38 + breath * 0.18;
            pose.shadowW = 56;
            break;
        case 'jacks':
            pose.rootY = baseY - 98 - jackOpen * 16;
            pose.leftUpperArm = 1.78 + jackOpen * 1.35;
            pose.leftForeArm = 1.64 + jackOpen * 0.84;
            pose.rightUpperArm = 1.5 - jackOpen * 1.35;
            pose.rightForeArm = 1.42 - jackOpen * 0.84;
            pose.leftUpperLeg = 1.36 + jackOpen * 0.42;
            pose.leftLowerLeg = 1.5 - jackOpen * 0.18;
            pose.rightUpperLeg = 1.78 - jackOpen * 0.42;
            pose.rightLowerLeg = 1.58 + jackOpen * 0.18;
            pose.shadowW = 56 + jackOpen * 18;
            pose.shadowH = 11 + jackOpen * 2;
            break;
        case 'breathe':
            pose.rootY = baseY - 96 - breath * 10;
            pose.torsoAngle = -Math.PI / 2 + Math.sin(time * 1.2) * 0.03;
            pose.haloPulse = breath;
            break;
        default:
            pose.rootY = baseY - 96 + Math.sin(time * 3.2) * 3;
            pose.leftUpperArm = 1.7 + brisk * 0.18;
            pose.rightUpperArm = 1.42 - brisk * 0.18;
            pose.leftUpperLeg = 1.44 + brisk * 0.1;
            pose.rightUpperLeg = 1.72 - brisk * 0.1;
            break;
        }

        return pose;
    }

    resolvePose(width, height, time, dt) {
        const targets = this.buildPoseTargets(width, height, time);
        const pose = {};
        Object.entries(targets).forEach(([key, target]) => {
            const stiffness = key === 'rootX' || key === 'rootY' ? 150 : 210;
            const damping = key === 'rootX' || key === 'rootY' ? 24 : 26;
            pose[key] = this.springValue(key, target, dt, stiffness, damping);
        });
        return pose;
    }

    drawGrid(width, height) {
        const ctx = this.ctx;
        ctx.fillStyle = '#08111f';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(96, 165, 250, 0.11)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 24) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += 24) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    draw() {
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width || 280;
        const height = rect.height || 180;
        const ctx = this.ctx;
        const pose = this.resolvePose(width, height, this.elapsed, this.delta);

        this.drawGrid(width, height);

        const torsoLen = 54;
        const armLen = 31;
        const forearmLen = 28;
        const thighLen = 34;
        const shinLen = 30;

        const hip = { x: pose.rootX, y: pose.rootY };
        const shoulder = polar(hip, pose.torsoAngle, torsoLen);
        const head = { x: shoulder.x + pose.headOffsetX, y: shoulder.y + pose.headOffsetY };
        const lElbow = polar(shoulder, pose.leftUpperArm, armLen);
        const lHand = polar(lElbow, pose.leftForeArm, forearmLen);
        const rElbow = polar(shoulder, pose.rightUpperArm, armLen);
        const rHand = polar(rElbow, pose.rightForeArm, forearmLen);
        const lKnee = polar(hip, pose.leftUpperLeg, thighLen);
        const lFoot = polar(lKnee, pose.leftLowerLeg, shinLen);
        const rKnee = polar(hip, pose.rightUpperLeg, thighLen);
        const rFoot = polar(rKnee, pose.rightLowerLeg, shinLen);

        const groundY = height * 0.86;

        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.beginPath();
        ctx.ellipse(hip.x, groundY, pose.shadowW, pose.shadowH, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(96, 165, 250, 0.78)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(width * 0.18, height * 0.22, 20 + pose.haloPulse * 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.38)';
        ctx.lineWidth = 4;
        drawSegment(ctx, shoulder, rElbow);
        drawSegment(ctx, rElbow, rHand);
        drawSegment(ctx, hip, rKnee);
        drawSegment(ctx, rKnee, rFoot);

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        drawSegment(ctx, shoulder, hip);
        drawSegment(ctx, shoulder, lElbow);
        drawSegment(ctx, lElbow, lHand);
        drawSegment(ctx, hip, lKnee);
        drawSegment(ctx, lKnee, lFoot);

        ctx.strokeStyle = '#fbbf24';
        drawSegment(ctx, shoulder, rElbow);
        drawSegment(ctx, rElbow, rHand);
        drawSegment(ctx, hip, rKnee);
        drawSegment(ctx, rKnee, rFoot);

        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(head.x, head.y, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e5eefc';
        ctx.font = '12px Space Grotesk, sans-serif';
        ctx.fillText(this.currentAnim.replace(/_/g, ' ').toUpperCase(), 14, 22);
        ctx.fillStyle = 'rgba(229, 238, 252, 0.76)';
        ctx.fillText('Spring-driven motion guide', 14, 40);
    }
}

function easeInOut(value) {
    const clamped = Math.max(0, Math.min(1, value));
    return clamped * clamped * (3 - 2 * clamped);
}

function polar(origin, angle, length) {
    return {
        x: origin.x + Math.cos(angle) * length,
        y: origin.y + Math.sin(angle) * length
    };
}

function drawSegment(ctx, a, b) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
}

window.KineticsFallback2D = KineticsFallback2D;
