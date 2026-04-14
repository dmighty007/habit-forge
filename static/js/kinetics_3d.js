/**
 * kinetics_3d.js
 * Advanced Musculoskeletal 3D Engine for Bio-Forge Kinetics 2.5
 * Uses stylized procedural geometry and muscle-glow effects.
 */

class Kinetics3D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(40, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: false, antialias: true });
        this.renderer.setClearColor(0x050508, 1);
        
        this.initScene();
        this.createMannequin();
        this.animate();
        
        this.currentAnim = null;
        this.clock = new THREE.Clock();
    }

    initScene() {
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.camera.position.set(0, 1.8, 5);
        this.camera.lookAt(0, 1, 0);
        
        // Mood Lighting
        const ambient = new THREE.AmbientLight(0x404040, 1.0);
        this.scene.add(ambient);
        
        const hemi = new THREE.HemisphereLight(0x4FC3F7, 0x000000, 0.8);
        this.scene.add(hemi);

        const rimLight = new THREE.PointLight(0x4FC3F7, 5, 20);
        rimLight.position.set(-5, 5, -5);
        this.scene.add(rimLight);

        const fillLight = new THREE.PointLight(0xFFD600, 1, 10);
        fillLight.position.set(5, 5, 5);
        this.scene.add(fillLight);

        // Cyber Grid with Glow
        const grid = new THREE.GridHelper(20, 20, 0x4FC3F7, 0x111111);
        grid.position.y = -0.01;
        this.scene.add(grid);
    }

    createMannequin() {
        this.mannequin = new THREE.Group();
        
        // Materials
        this.baseMat = new THREE.MeshStandardMaterial({ 
            color: 0x222222, 
            emissive: 0x4FC3F7, 
            emissiveIntensity: 0.8, // STARK GLOW
            metalness: 0.9,
            roughness: 0.1
        });
        this.muscleMat = new THREE.MeshStandardMaterial({ 
            color: 0x4FC3F7,
            emissive: 0x4FC3F7,
            emissiveIntensity: 2.0, // BRIGHT MUSCLE GLOW
            wireframe: false
        });
        this.jointMat = new THREE.MeshStandardMaterial({ color: 0xFFD600 });

        // Build Skeleton
        this.torso = this.createSegment(0.6, 0.9, 0.3, this.baseMat);
        this.torso.position.y = 1.3;
        this.mannequin.add(this.torso);

        // Core / Hips
        this.hips = this.createSegment(0.5, 0.2, 0.25, this.baseMat);
        this.hips.position.y = -0.55;
        this.torso.add(this.hips);

        // Head
        this.head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 24), this.baseMat);
        this.head.position.y = 0.65;
        this.torso.add(this.head);

        // Limbs function
        const createLimb = (len, w) => {
            const group = new THREE.Group();
            const upper = this.createSegment(w, len/2, w, this.muscleMat); // Muscles on upper
            const lower = this.createSegment(w*0.8, len/2, w*0.8, this.baseMat);
            upper.add(lower);
            lower.position.y = -len/2;
            group.add(upper);
            return { group, upper, lower };
        };

        // Arms
        this.lArm = createLimb(0.8, 0.15);
        this.lArm.group.position.set(-0.35, 0.35, 0);
        this.torso.add(this.lArm.group);

        this.rArm = createLimb(0.8, 0.15);
        this.rArm.group.position.set(0.35, 0.35, 0);
        this.torso.add(this.rArm.group);

        // Legs
        this.lLeg = createLimb(1.2, 0.22);
        this.lLeg.group.position.set(-0.16, -0.1, 0);
        this.hips.add(this.lLeg.group);

        this.rLeg = createLimb(1.2, 0.22);
        this.rLeg.group.position.set(0.16, -0.1, 0);
        this.hips.add(this.rLeg.group);

        this.scene.add(this.mannequin);
    }

    createSegment(w, h, d, mat) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = -h / 2; // Pivot at top
        const pivot = new THREE.Group();
        pivot.add(mesh);
        return pivot;
    }

    setAnimation(type) {
        this.currentAnim = type;
        this.resetPose();
    }

    resetPose() {
        this.mannequin.position.set(0, 0, 0);
        this.mannequin.rotation.set(0, 0, 0);
        this.torso.position.y = 1.3;
        this.torso.rotation.set(0,0,0);
        this.hips.rotation.set(0,0,0);
        
        this.lArm.upper.rotation.set(0,0,0);
        this.lArm.lower.rotation.set(0,0,0);
        this.rArm.upper.rotation.set(0,0,0);
        this.rArm.lower.rotation.set(0,0,0);
        
        this.lLeg.upper.rotation.set(0,0,0);
        this.lLeg.lower.rotation.set(0,0,0);
        this.rLeg.upper.rotation.set(0,0,0);
        this.rLeg.lower.rotation.set(0,0,0);
        
        this.baseMat.emissiveIntensity = 0.1;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = this.clock.getElapsedTime();
        const cycle = (Math.sin(time * 3) + 1) / 2; // Smooth 0-1
        const fastCycle = (Math.sin(time * 6) + 1) / 2;

        if (this.currentAnim === 'squat') {
            const bend = cycle * 1.5;
            this.torso.position.y = 1.3 - (cycle * 0.8);
            this.lLeg.upper.rotation.x = -bend;
            this.lLeg.lower.rotation.x = bend * 1.5;
            this.rLeg.upper.rotation.x = -bend;
            this.rLeg.lower.rotation.x = bend * 1.5;
            this.torso.rotation.x = cycle * 0.3;
            this.muscleMat.emissiveIntensity = 0.5 + cycle;
        } 
        else if (this.currentAnim === 'pushup') {
            this.mannequin.rotation.x = -Math.PI / 2.2;
            this.mannequin.position.y = 0.4 + (cycle * 0.5);
            this.lArm.upper.rotation.x = cycle * 1.8;
            this.lArm.lower.rotation.x = -cycle * 2;
            this.rArm.upper.rotation.x = cycle * 1.8;
            this.rArm.lower.rotation.x = -cycle * 2;
        }
        else if (this.currentAnim === 'plank') {
            this.mannequin.rotation.x = -Math.PI / 2.2;
            this.mannequin.position.y = 0.5 + (Math.sin(time * 4) * 0.02);
            this.baseMat.emissiveIntensity = 0.2 + (Math.sin(time * 4) * 0.2);
        }
        else if (this.currentAnim === 'jacks') {
            const armBend = fastCycle * 2.5;
            this.lArm.upper.rotation.z = armBend;
            this.rArm.upper.rotation.z = -armBend;
            this.lLeg.upper.rotation.z = fastCycle * 0.6;
            this.rLeg.upper.rotation.z = -fastCycle * 0.6;
        }
        else if (this.currentAnim === 'bridge') {
            this.mannequin.rotation.x = Math.PI / 2;
            this.hips.rotation.x = -cycle * 1.2;
            this.mannequin.position.y = 0.2 + (cycle * 0.6);
        }
        else if (this.currentAnim === 'leg_raise') {
             this.mannequin.rotation.x = Math.PI / 2.5;
             this.lLeg.upper.rotation.x = -cycle * 1.6;
             this.rLeg.upper.rotation.x = -cycle * 1.6;
        }

        this.renderer.render(this.scene, this.camera);
    }

    resize() {
        if (!this.canvas) return;
        this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    }
}

window.Kinetics3D = Kinetics3D;
