/**
 * kinetics_3d.js
 * Procedural 3D Mannequin Engine for Bio-Forge Kinetics 2.0
 */

class Kinetics3D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: false, antialias: true });
        this.renderer.setClearColor(0x0a0a0f, 1);
        
        this.initScene();
        this.createMannequin();
        this.animate();
        
        this.currentAnim = null;
        this.clock = new THREE.Clock();
    }

    initScene() {
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.camera.position.set(0, 1.5, 4);
        
        const light = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(light);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        this.scene.add(directionalLight);

        // Grid/Floor for reference
        const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        this.scene.add(grid);
    }

    createMannequin() {
        this.mannequin = new THREE.Group();
        
        // Materials (Neon theme-aware)
        const skinMat = new THREE.MeshPhongMaterial({ color: 0x4FC3F7, wireframe: false, shininess: 100 });
        const jointMat = new THREE.MeshPhongMaterial({ color: 0xFFD600 });

        // Torso
        this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.3), skinMat);
        this.torso.position.y = 1.2;
        this.mannequin.add(this.torso);

        // Head
        this.head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), skinMat);
        this.head.position.y = 0.6;
        this.torso.add(this.head);

        // Arms (simplified joints)
        this.leftArm = this.createLimb(0.15, 0.5, skinMat);
        this.leftArm.position.set(-0.35, 0.3, 0);
        this.torso.add(this.leftArm);

        this.rightArm = this.createLimb(0.15, 0.5, skinMat);
        this.rightArm.position.set(0.35, 0.3, 0);
        this.torso.add(this.rightArm);

        // Legs
        this.leftLeg = this.createLimb(0.2, 0.7, skinMat);
        this.leftLeg.position.set(-0.15, -0.4, 0);
        this.torso.add(this.leftLeg);

        this.rightLeg = this.createLimb(0.2, 0.7, skinMat);
        this.rightLeg.position.set(0.15, -0.4, 0);
        this.torso.add(this.rightLeg);

        this.scene.add(this.mannequin);
    }

    createLimb(width, height, mat) {
        const group = new THREE.Group();
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, width), mat);
        mesh.position.y = -height / 2;
        group.add(mesh);
        return group;
    }

    setAnimation(type) {
        this.currentAnim = type;
        this.resetPose();
    }

    resetPose() {
        this.mannequin.position.set(0, 0, 0);
        this.mannequin.rotation.set(0, 0, 0);
        this.torso.position.y = 1.2;
        this.torso.rotation.set(0,0,0);
        this.leftArm.rotation.set(0,0,0);
        this.rightArm.rotation.set(0,0,0);
        this.leftLeg.rotation.set(0,0,0);
        this.rightLeg.rotation.set(0,0,0);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = this.clock.getElapsedTime();
        const cycle = (Math.sin(time * 3) + 1) / 2; // 0 to 1 loop

        if (this.currentAnim === 'squat') {
            this.torso.position.y = 1.2 - (cycle * 0.6);
            this.leftLeg.rotation.x = -cycle * 1.5;
            this.rightLeg.rotation.x = -cycle * 1.5;
            this.leftArm.rotation.x = cycle * 1.2;
            this.rightArm.rotation.x = cycle * 1.2;
        } else if (this.currentAnim === 'pushup') {
            this.mannequin.rotation.x = -Math.PI / 2.5;
            this.mannequin.position.y = 0.5 + (cycle * 0.3);
            this.leftArm.rotation.x = -cycle * 1.2;
            this.rightArm.rotation.x = -cycle * 1.2;
        } else if (this.currentAnim === 'plank') {
            this.mannequin.rotation.x = -Math.PI / 2.5;
            this.mannequin.position.y = 0.6 + (Math.sin(time * 5) * 0.02); // Breathing pulse
        } else if (this.currentAnim === 'jacks') {
            const jackCycle = (Math.sin(time * 6) + 1) / 2;
            this.leftArm.rotation.z = jackCycle * 2.5;
            this.rightArm.rotation.z = -jackCycle * 2.5;
            this.leftLeg.rotation.z = jackCycle * 0.5;
            this.rightLeg.rotation.z = -jackCycle * 0.5;
        } else if (this.currentAnim === 'bridge') {
             this.mannequin.rotation.x = Math.PI / 2;
             this.mannequin.position.y = 0.3 + (cycle * 0.6);
        } else if (this.currentAnim === 'curl') {
             this.leftArm.rotation.x = cycle * 2;
             this.rightArm.rotation.x = cycle * 2;
        }

        this.renderer.render(this.scene, this.camera);
    }

    resize() {
        this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    }
}

window.Kinetics3D = Kinetics3D;
