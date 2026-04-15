/**
 * kinetics_3d.js
 * Kinetics stage using the official Three.js RobotExpressive example model.
 * Falls back to a simple rig only if the remote model or loader is unavailable.
 */

class Kinetics3D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        if (typeof window.THREE === 'undefined') {
            this.renderUnavailable = true;
            console.error('Kinetics3D requires Three.js on window.THREE');
            return;
        }

        this.mixamoManifest = window.KINETICS_MIXAMO || { animations: {} };
        this.MODEL_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb';
        this.currentAnim = 'idle';
        this.currentClip = null;
        this.clock = new THREE.Clock();
        this.elapsed = 0;
        this.intensityBoost = false;
        this.mixer = null;
        this.actions = {};
        this.mixamoActions = {};
        this.mixamoClipPromises = {};
        this.mixamoClips = {};
        this.usingMixamoAvatar = false;
        this.isFallbackRig = false;
        this.renderUnavailable = false;
        this.proceduralAnimationTypes = new Set([
            'breathe',
            'bridge',
            'calf_raise',
            'climber',
            'curl',
            'jacks',
            'leg_raise',
            'lunge',
            'plank',
            'pushup',
            'pushup_incline',
            'row',
            'squat',
            'stretch'
        ]);
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050508, 0.085);

        this.characterRoot = new THREE.Group();
        this.characterRoot.scale.setScalar(0.42); 
        this.characterRoot.position.y = 0.65; // Lift character up significantly more and scale slightly
        this.scene.add(this.characterRoot);

        this.initialBoneRotations = new Map();
        this.stagePulse = 0;
        this.poseValues = {};
        this.poseVelocity = {};

        this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 1000);
        try {
            this.renderer = this.createRenderer();
        } catch (error) {
            this.renderUnavailable = true;
            console.error('Kinetics3D renderer unavailable:', error);
            return;
        }
        if (!this.renderer) {
            this.renderUnavailable = true;
            console.error('Kinetics3D renderer unavailable: no WebGL context');
            return;
        }
        this.renderer.setClearColor(0x050508, 1);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        if ('outputEncoding' in this.renderer) {
            this.renderer.outputEncoding = THREE.sRGBEncoding;
        }

        this.initScene();
        this.loadCharacter();
        this.resize();
        this.animate();

        window.addEventListener('resize', () => this.resize());
    }

    createRenderer() {
        const contextAttributes = {
            alpha: false,
            antialias: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
            premultipliedAlpha: false
        };
        const gl = this.canvas.getContext('webgl2', contextAttributes)
            || this.canvas.getContext('webgl', contextAttributes)
            || this.canvas.getContext('experimental-webgl', contextAttributes);
        if (!gl) return null;

        const renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            context: gl,
            alpha: false,
            antialias: true,
            powerPreference: 'high-performance'
        });

        this.canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            this.renderUnavailable = true;
        });

        this.canvas.addEventListener('webglcontextrestored', () => {
            this.renderUnavailable = false;
            this.resize();
        });

        return renderer;
    }

    initScene() {
        this.scene.add(this.characterRoot);

        this.camera.position.set(0.2, 1.6, 3.8);
        this.camera.lookAt(0, 1.4, 0);

        const ambient = new THREE.AmbientLight(0xffffff, 1.25);
        this.scene.add(ambient);

        const hemi = new THREE.HemisphereLight(0x86bfff, 0x050508, 1.6);
        hemi.position.set(0, 8, 0);
        this.scene.add(hemi);

        const key = new THREE.DirectionalLight(0xffffff, 1.2);
        key.position.set(2.5, 5, 4);
        this.scene.add(key);

        const rimA = new THREE.PointLight(0x4fc3f7, 3, 16);
        rimA.position.set(-3, 2.6, -2.6);
        this.scene.add(rimA);

        const rimB = new THREE.PointLight(0xfbbf24, 2.4, 16);
        rimB.position.set(3.4, 1.8, 2.8);
        this.scene.add(rimB);

        // Removed the "black dot" floor completely as requested by the user.

        this.stageRing = new THREE.Mesh(
            new THREE.TorusGeometry(1.32, 0.05, 16, 72),
            new THREE.MeshBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.42 })
        );
        this.stageRing.rotation.x = Math.PI / 2;
        this.stageRing.position.y = -1.08;
        this.scene.add(this.stageRing);

        this.stageHalo = new THREE.Mesh(
            new THREE.CircleGeometry(1.65, 48),
            new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.08 })
        );
        this.stageHalo.rotation.x = -Math.PI / 2;
        this.stageHalo.position.y = -1.1;
        this.scene.add(this.stageHalo);
    }

    loadCharacter() {
        // Force the high-quality remote Robot model as our standard high-fidelity avatar.
        // This eliminates 404 errors from missing local assets and ensures a premium experience.
        this.loadRobotCharacter();
    }

    loadMixamoAvatar(url) {
        if (!url || url.includes('/static/media')) {
            // Force bulletproof remote fallback if local assets are likely missing
            this.loadRobotCharacter();
            return;
        }
        const loader = new THREE.GLTFLoader();
        loader.load(
            url,
            (gltf) => this.setupCharacter(gltf, true),
            undefined,
            () => this.loadRobotCharacter()
        );
    }

    loadRobotCharacter() {
        const loader = new THREE.GLTFLoader();
        loader.load(
            this.MODEL_URL,
            (gltf) => this.setupCharacter(gltf, false),
            undefined,
            () => this.createFallbackRig()
        );
    }

    setupCharacter(gltf, isMixamoAvatar = false) {
        this.characterRoot.clear();
        this.actions = {};
        this.mixamoActions = {};
        this.currentClip = null;
        this.usingMixamoAvatar = isMixamoAvatar;
        this.isFallbackRig = false;
        this.fallbackParts = null;

        this.character = gltf.scene;
        const avatarScale = isMixamoAvatar ? (this.mixamoManifest.avatar?.scale || 1) : 0.82;
        const avatarY = isMixamoAvatar ? (this.mixamoManifest.avatar?.positionY ?? -1.12) : -1.12;
        this.character.scale.setScalar(avatarScale);
        this.character.position.set(0, avatarY, 0);

        this.character.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.roughness = 0.45;
                child.material.metalness = 0.18;
                child.frustumCulled = false;
            }
        });

        this.characterRoot.add(this.character);
        this.cacheBones(this.character);

        this.mixer = new THREE.AnimationMixer(this.character);

        if (gltf.animations && gltf.animations.length) {
            gltf.animations.forEach((clip) => {
                this.actions[clip.name] = this.mixer.clipAction(clip);
            });
        }

        if (this.currentAnim) {
            this.setAnimation(this.currentAnim);
        } else if (gltf.animations && gltf.animations.length) {
            this.playClip('Idle');
        }
    }

    createFallbackRig() {
        this.characterRoot.clear();
        this.isFallbackRig = true;
        this.usingMixamoAvatar = false;
        this.actions = {};
        this.mixamoActions = {};
        this.currentClip = null;
        this.boneRefs = {};
        this.initialBoneRotations.clear();
        this.character = new THREE.Group();
        this.character.position.set(0, -0.72, 0);

        const bodyMat = new THREE.MeshPhysicalMaterial({
            color: 0x4fc3f7,
            emissive: 0x0ea5e9,
            emissiveIntensity: 0.6,
            roughness: 0.15,
            metalness: 0.8,
            transmission: 0.5,
            thickness: 0.2,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            transparent: true,
            opacity: 0.95
        });

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 24, 24), bodyMat);
        head.position.set(0, 1.62, 0);
        this.character.add(head);

        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.96, 20), bodyMat);
        torso.position.set(0, 1.02, 0);
        this.character.add(torso);

        const armGeo = new THREE.CylinderGeometry(0.08, 0.085, 0.78, 16);
        const legGeo = new THREE.CylinderGeometry(0.1, 0.11, 0.92, 16);

        this.fallbackParts = {
            lArm: new THREE.Mesh(armGeo, bodyMat),
            rArm: new THREE.Mesh(armGeo, bodyMat),
            lLeg: new THREE.Mesh(legGeo, bodyMat),
            rLeg: new THREE.Mesh(legGeo, bodyMat),
        };

        this.fallbackParts.lArm.position.set(-0.34, 1.1, 0);
        this.fallbackParts.rArm.position.set(0.34, 1.1, 0);
        this.fallbackParts.lLeg.position.set(-0.14, 0.24, 0);
        this.fallbackParts.rLeg.position.set(0.14, 0.24, 0);

        Object.values(this.fallbackParts).forEach((part) => this.character.add(part));
        this.characterRoot.add(this.character);
    }

    cacheBones(root) {
        const bones = [];
        root.traverse((child) => {
            if (child.isBone) bones.push(child);
        });

        const findBone = (patterns) => {
            return bones.find((bone) => {
                const name = bone.name.toLowerCase();
                return patterns.some((pattern) => pattern.every((token) => name.includes(token)));
            }) || null;
        };

        this.boneRefs = {
            hips: findBone([['hips'], ['pelvis']]),
            spine: findBone([['spine']]),
            chest: findBone([['chest'], ['spine2'], ['upper', 'chest']]),
            head: findBone([['head']]),
            leftUpperArm: findBone([['upper', 'arm', 'l'], ['left', 'arm'], ['leftarm'], ['left', 'upperarm']]),
            leftForeArm: findBone([['lower', 'arm', 'l'], ['fore', 'arm', 'l'], ['left', 'forearm'], ['leftforearm'], ['left', 'lowerarm']]),
            rightUpperArm: findBone([['upper', 'arm', 'r'], ['right', 'arm'], ['rightarm'], ['right', 'upperarm']]),
            rightForeArm: findBone([['lower', 'arm', 'r'], ['fore', 'arm', 'r'], ['right', 'forearm'], ['rightforearm'], ['right', 'lowerarm']]),
            leftUpperLeg: findBone([['upper', 'leg', 'l'], ['thigh', 'l'], ['left', 'upleg'], ['leftupleg'], ['left', 'thigh']]),
            leftLowerLeg: findBone([['lower', 'leg', 'l'], ['calf', 'l'], ['left', 'leg'], ['leftleg'], ['left', 'calf']]),
            rightUpperLeg: findBone([['upper', 'leg', 'r'], ['thigh', 'r'], ['right', 'upleg'], ['rightupleg'], ['right', 'thigh']]),
            rightLowerLeg: findBone([['lower', 'leg', 'r'], ['calf', 'r'], ['right', 'leg'], ['rightleg'], ['right', 'calf']]),
        };

        this.initialBoneRotations.clear();
        Object.values(this.boneRefs).forEach((bone) => {
            if (bone) this.initialBoneRotations.set(bone.uuid, bone.rotation.clone());
        });
    }

    playClip(name) {
        if (!this.mixer) return;

        const actionMatch = Object.entries(this.actions).find(([clipName]) => {
            const low = clipName.toLowerCase();
            return low === name.toLowerCase() || low === name.toLowerCase() + 'ing' || (name.toLowerCase() === 'idle' && low === 'idling');
        });
        if (!actionMatch) return;
        const nextAction = actionMatch[1];

        if (this.currentClip === nextAction) return;

        // If we are about to play a procedural animation, fade out the mixer completely
        if (this.proceduralAnimationTypes.has(this.currentAnim)) {
            nextAction.stop();
            if (this.currentClip) this.currentClip.fadeOut(0.2);
            this.currentClip = null;
            return;
        }

        nextAction.reset().fadeIn(0.35).play();
        if (this.currentClip) this.currentClip.fadeOut(0.35);
        this.currentClip = nextAction;
    }

    getMixamoAnimationUrl(type) {
        return this.mixamoManifest.animations?.[type] || null;
    }

    loadMixamoClip(type) {
        if (this.mixamoClips[type]) return Promise.resolve(this.mixamoClips[type]);
        if (this.mixamoClipPromises[type]) return this.mixamoClipPromises[type];
        if (typeof THREE.FBXLoader !== 'function') return Promise.resolve(null);

        const url = this.getMixamoAnimationUrl(type);
        if (!url) return Promise.resolve(null);

        const loader = new THREE.FBXLoader();
        this.mixamoClipPromises[type] = new Promise((resolve) => {
            loader.load(
                url,
                (fbx) => {
                    const clip = fbx.animations && fbx.animations.length ? fbx.animations[0].clone() : null;
                    if (clip) clip.name = type;
                    this.mixamoClips[type] = clip;
                    resolve(clip);
                },
                undefined,
                () => {
                    this.mixamoClips[type] = null;
                    resolve(null);
                }
            );
        });

        return this.mixamoClipPromises[type];
    }

    playAction(action) {
        if (!action) return;
        action.reset().fadeIn(0.35).play();
        if (this.currentClip && this.currentClip !== action) this.currentClip.fadeOut(0.35);
        this.currentClip = action;
    }

    playMixamoAnimation(type) {
        if (!this.mixer || !this.usingMixamoAvatar) return false;
        if (this.proceduralAnimationTypes.has(type)) return false;

        const url = this.getMixamoAnimationUrl(type);
        if (!url) return false;

        this.loadMixamoClip(type).then((clip) => {
            if (!this.mixer || this.currentAnim !== type) return;
            if (!clip) {
                const fallbackClip = this.getFallbackClipName(type);
                if (fallbackClip) this.playClip(fallbackClip);
                return;
            }
            if (!this.mixamoActions[type]) {
                this.mixamoActions[type] = this.mixer.clipAction(clip);
            }
            this.playAction(this.mixamoActions[type]);
        });

        return true;
    }

    getFallbackClipName(type) {
        const clipMap = {
            pushup: 'Idle',
            pushup_incline: 'Idle',
            plank: 'Idle',
            bridge: 'Idle',
            leg_raise: 'Idle',
            stretch: 'Idle',
            breathe: 'Idle',
            squat: 'Idle',
            lunge: 'Idle',
            calf_raise: 'Idle',
            row: 'Idle',
            curl: 'Idle',
            jacks: 'Idle',
            climber: 'Idle',
            dance: 'Dance',
            walk: 'Walking'
        };
        return clipMap[type] || 'Idle';
    }

    setAnimation(type) {
        this.currentAnim = type;

        if (type && this.playMixamoAnimation(type)) return;

        // Stop current clip if switching to procedural to avoid fighting
        if (this.proceduralAnimationTypes.has(type)) {
            if (this.currentClip) {
                this.currentClip.fadeOut(0.25);
                this.currentClip = null;
            }
        }
        
        this.playClip(this.getFallbackClipName(type));
    }

    easeValue(current, target, smoothing) {
        return THREE.MathUtils.lerp(current, target, smoothing);
    }

    easeEuler(euler, target, smoothing) {
        euler.x = this.easeValue(euler.x, target.x, smoothing);
        euler.y = this.easeValue(euler.y, target.y, smoothing);
        euler.z = this.easeValue(euler.z, target.z, smoothing);
    }

    springPoseValue(key, target, dt, stiffness = 150, damping = 22) {
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
            const phase = (cycle - holdTop) / downRatio;
            // Smoother ease-in-out
            return phase * phase * phase * (phase * (phase * 6 - 15) + 10);
        }
        if (cycle < holdTop + downRatio + holdBottom) return 1;
        const upDuration = Math.max(0.01, 1 - holdTop - downRatio - holdBottom);
        const phase = (cycle - holdTop - downRatio - holdBottom) / upDuration;
        const eased = phase * phase * phase * (phase * (phase * 6 - 15) + 10);
        return 1 - eased;
    }

    buildRigTargets(time) {
        const rep = this.phaseWave(time, 0.42);
        const brisk = this.phaseWave(time, 0.72, 0.34, 0.04, 0.08);
        const jackOpen = this.phaseWave(time, 0.92, 0.3, 0.03, 0.08);
        const breath = (Math.sin(time * 2.1) + 1) / 2;
        const alt = Math.sin(time * Math.PI * 2 * 0.36);

        const targets = {
            rootX: 0,
            rootY: 0,
            rootRotX: 0,
            rootRotY: 0,
            rootRotZ: 0,
            hipsX: 0,
            hipsY: 0,
            hipsZ: 0,
            spineX: 0,
            spineY: 0,
            spineZ: 0,
            chestX: breath * 0.05,
            chestY: 0,
            chestZ: 0,
            headX: 0,
            leftUpperArmX: -0.18,
            leftUpperArmZ: 0,
            leftForeArmX: -0.08,
            rightUpperArmX: -0.18,
            rightUpperArmZ: 0,
            rightForeArmX: -0.08,
            leftUpperLegX: 0.06,
            leftUpperLegZ: 0,
            leftLowerLegX: -0.08,
            rightUpperLegX: 0.06,
            rightUpperLegZ: 0,
            rightLowerLegX: -0.08
        };

        switch (this.currentAnim) {
        case 'squat':
            targets.rootY = -rep * 0.2;
            targets.rootX = -rep * 0.04;
            targets.hipsX = -rep * 0.42;
            targets.spineX = rep * 0.24;
            targets.chestX = rep * 0.12;
            targets.leftUpperLegX = rep * 1.08;
            targets.rightUpperLegX = rep * 1.08;
            targets.leftLowerLegX = -rep * 1.06;
            targets.rightLowerLegX = -rep * 1.06;
            targets.leftUpperArmX = -0.12 - rep * 0.2;
            targets.rightUpperArmX = -0.12 - rep * 0.2;
            break;
        case 'lunge':
            targets.rootX = alt * 0.08;
            targets.rootY = -rep * 0.12;
            targets.hipsZ = 0.08;
            targets.spineZ = 0.08;
            targets.leftUpperLegX = rep * 1.02;
            targets.leftLowerLegX = -rep * 1.04;
            targets.rightUpperLegX = -rep * 0.42;
            targets.rightLowerLegX = rep * 0.28;
            targets.leftUpperArmX = -0.08 - alt * 0.14;
            targets.rightUpperArmX = -0.08 + alt * 0.14;
            break;
        case 'curl':
            targets.leftUpperArmX = -0.3;
            targets.rightUpperArmX = -0.3;
            targets.leftForeArmX = -brisk * 1.95;
            targets.rightForeArmX = -brisk * 1.95;
            break;
        case 'row':
            targets.hipsX = 0.28;
            targets.spineX = 0.16;
            targets.leftUpperArmX = brisk * 0.9;
            targets.rightUpperArmX = brisk * 0.9;
            targets.leftForeArmX = -0.32 - brisk * 0.4;
            targets.rightForeArmX = -0.32 - brisk * 0.4;
            break;
        case 'pushup':
            targets.rootRotX = -Math.PI / 2.16;
            targets.rootY = - rep * 0.24; // Character goes DOWN when rep increases
            targets.spineX = rep * 0.06;
            targets.leftUpperArmX = rep * 1.1;
            targets.rightUpperArmX = rep * 1.1;
            targets.leftForeArmX = -0.24 - rep * 1.08;
            targets.rightForeArmX = -0.24 - rep * 1.08;
            targets.leftUpperLegX = -0.08;
            targets.rightUpperLegX = -0.08;
            targets.leftLowerLegX = 0.02;
            targets.rightLowerLegX = 0.02;
            break;
        case 'pushup_incline':
            targets.rootRotX = -Math.PI / 4.7;
            targets.rootY = - rep * 0.18; // Character goes DOWN when rep increases
            targets.leftUpperArmX = rep * 0.88;
            targets.rightUpperArmX = rep * 0.88;
            targets.leftForeArmX = -0.16 - rep * 0.84;
            targets.rightForeArmX = -0.16 - rep * 0.84;
            targets.leftUpperLegX = 0.18;
            targets.rightUpperLegX = 0.18;
            break;
        case 'plank':
            targets.rootRotX = -Math.PI / 2.2;
            targets.rootY = -0.38 + breath * 0.015;
            targets.spineX = 0.04;
            targets.chestX = 0.08 + breath * 0.03;
            targets.leftUpperArmX = 0.18;
            targets.rightUpperArmX = 0.18;
            targets.leftForeArmX = -0.96;
            targets.rightForeArmX = -0.96;
            targets.leftUpperLegX = -0.06;
            targets.rightUpperLegX = -0.06;
            break;
        case 'bridge':
            targets.rootRotX = Math.PI / 2.12;
            targets.rootY = -0.44 + rep * 0.08;
            targets.hipsX = -rep * 0.64;
            targets.leftUpperLegX = -0.34;
            targets.rightUpperLegX = -0.34;
            break;
        case 'leg_raise':
            targets.rootRotX = Math.PI / 2.22;
            targets.rootY = -0.42;
            targets.leftUpperLegX = -rep * 1.02;
            targets.rightUpperLegX = -rep * 1.02;
            targets.leftLowerLegX = rep * 0.18;
            targets.rightLowerLegX = rep * 0.18;
            break;
        case 'calf_raise':
            targets.rootY = brisk * 0.09;
            targets.leftUpperLegX = brisk * 0.08;
            targets.rightUpperLegX = brisk * 0.08;
            break;
        case 'jacks':
            targets.rootY = jackOpen * 0.18;
            targets.leftUpperArmZ = jackOpen * 2.24;
            targets.rightUpperArmZ = -jackOpen * 2.24;
            targets.leftUpperLegZ = jackOpen * 0.44;
            targets.rightUpperLegZ = -jackOpen * 0.44;
            break;
        case 'climber':
            targets.rootRotX = -Math.PI / 2.18;
            targets.rootY = -0.34;
            targets.leftUpperLegX = -brisk * 1.18;
            targets.rightUpperLegX = -(1 - brisk) * 1.18;
            targets.leftUpperArmX = (1 - brisk) * 0.72;
            targets.rightUpperArmX = brisk * 0.72;
            break;
        case 'stretch':
            targets.rootY = -breath * 0.02;
            targets.leftUpperArmZ = 2.02 + breath * 0.36;
            targets.rightUpperArmZ = -2.02 - breath * 0.36;
            targets.chestX = breath * 0.12;
            break;
        case 'breathe':
            targets.rootY = -breath * 0.04;
            targets.spineX = breath * 0.05;
            targets.chestX = breath * 0.08;
            break;
        default:
            break;
        }

        return targets;
    }

    resolveRigPose(time, delta) {
        const targets = this.buildRigTargets(time);
        const pose = {};
        Object.entries(targets).forEach(([key, target]) => {
            const stiffness = key.startsWith('root') ? 120 : 160;
            const damping = key.startsWith('root') ? 20 : 22;
            pose[key] = this.springPoseValue(key, target, delta, stiffness, damping);
        });
        return pose;
    }

    animateFallback(time, delta) {
        if (!this.fallbackParts) {
            this.createFallbackRig();
        }
        
        if (this.character) {
            this.character.visible = false;
        }

        if (this.fallbackParts && this.character) {
            this.character.visible = true;
            const resolvedPose = this.resolveRigPose(this.elapsed, delta);
            
            this.character.position.x = resolvedPose.rootX;
            this.character.position.y = -0.05 + resolvedPose.rootY; // Deeply centered

            this.fallbackParts.lArm.rotation.x = resolvedPose.leftUpperArmX;
            this.fallbackParts.lArm.rotation.z = resolvedPose.leftUpperArmZ;
            this.fallbackParts.rArm.rotation.x = resolvedPose.rightUpperArmX;
            this.fallbackParts.rArm.rotation.z = resolvedPose.rightUpperArmZ;
            this.fallbackParts.lLeg.rotation.x = resolvedPose.leftUpperLegX;
            this.fallbackParts.lLeg.rotation.z = resolvedPose.leftUpperLegZ;
            this.fallbackParts.rLeg.rotation.x = resolvedPose.rightUpperLegX;
            this.fallbackParts.rLeg.rotation.z = resolvedPose.rightUpperLegZ;
        }

        if (this.character) {
            const resolvedPose = this.resolveRigPose(this.elapsed, delta);
            this.character.rotation.x = resolvedPose.rootRotX;
            this.character.rotation.y = resolvedPose.rootRotY;
            this.character.rotation.z = resolvedPose.rootRotZ;
        }
    }

    updateRig(time, delta) {
        const smoothing = 1 - Math.exp(-delta * 9);

        if (this.isFallbackRig || !this.character) {
            this.animateFallback(time, delta);
            return;
        }

        // Ensure fallback parts are hidden if character is ready
        if (this.fallbackParts) this.fallbackParts.visible = false;
        this.character.visible = true;

        if (!Object.keys(this.boneRefs).length) return;

        const pose = this.resolveRigPose(time, delta);

        const offsets = {
            hips: new THREE.Euler(pose.hipsX, pose.hipsY, pose.hipsZ),
            spine: new THREE.Euler(pose.spineX, pose.spineY, pose.spineZ),
            chest: new THREE.Euler(pose.chestX, pose.chestY, pose.chestZ),
            head: new THREE.Euler(pose.headX, 0, 0),
            leftUpperArm: new THREE.Euler(pose.leftUpperArmX, 0, pose.leftUpperArmZ),
            leftForeArm: new THREE.Euler(pose.leftForeArmX, 0, 0),
            rightUpperArm: new THREE.Euler(pose.rightUpperArmX, 0, pose.rightUpperArmZ),
            rightForeArm: new THREE.Euler(pose.rightForeArmX, 0, 0),
            leftUpperLeg: new THREE.Euler(pose.leftUpperLegX, 0, pose.leftUpperLegZ),
            leftLowerLeg: new THREE.Euler(pose.leftLowerLegX, 0, 0),
            rightUpperLeg: new THREE.Euler(pose.rightUpperLegX, 0, pose.rightUpperLegZ),
            rightLowerLeg: new THREE.Euler(pose.rightLowerLegX, 0, 0),
        };

        // Root position centered in camera frame
        const rootPos = { x: pose.rootX, y: -0.05 + pose.rootY, z: 0 };
        const rootRot = new THREE.Euler(pose.rootRotX, pose.rootRotY, pose.rootRotZ);

        this.characterRoot.position.lerp(new THREE.Vector3(rootPos.x, rootPos.y, rootPos.z), smoothing);
        this.easeEuler(this.characterRoot.rotation, rootRot, smoothing);

        Object.entries(this.boneRefs).forEach(([key, bone]) => {
            if (!bone) return;
            const base = this.initialBoneRotations.get(bone.uuid);
            const target = offsets[key];
            if (!base || !target) return;

            // Direct assignment with easing for procedural rigs
            // This wins over any mixer state because it's calculated every frame after mixer update
            // However, we stop the mixer anyway in setAnimation to be safe.
            bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, base.x + target.x, smoothing);
            bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, base.y + target.y, smoothing);
            bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, base.z + target.z, smoothing);
        });
    }

    updateStageEffects(time, delta) {
        const smoothing = 1 - Math.exp(-delta * 6);
        this.stagePulse = this.easeValue(this.stagePulse, this.intensityBoost ? 1 : 0.35, smoothing);
        const pulse = (Math.sin(time * 2.2) + 1) / 2;

        if (this.stageRing) {
            this.stageRing.rotation.z += delta * 0.35;
            this.stageRing.material.opacity = 0.24 + (pulse * 0.18 * this.stagePulse);
            this.stageRing.scale.setScalar(1 + pulse * 0.025);
        }

        if (this.stageHalo) {
            this.stageHalo.material.opacity = 0.05 + (pulse * 0.08 * this.stagePulse);
            this.stageHalo.scale.setScalar(1 + pulse * 0.035);
        }
    }

    updateCamera(time, delta) {
        const smoothing = 1 - Math.exp(-delta * 4);
        const targetPos = new THREE.Vector3(0.15, 1.45, 3.55);
        const targetLook = new THREE.Vector3(0, 1.05, 0);

        if (this.currentAnim === 'pushup' || this.currentAnim === 'plank' || this.currentAnim === 'climber') {
            targetPos.set(2.7, 0.95, 2.45);
            targetLook.set(0, 0.18, 0);
        } else if (this.currentAnim === 'bridge' || this.currentAnim === 'leg_raise') {
            targetPos.set(0.2, 2.7, 1.95);
            targetLook.set(0, 0.2, 0);
        } else if (this.currentAnim === 'stretch') {
            targetPos.set(0, 1.6, 3.2);
        } else if (this.currentAnim === 'jacks' || this.currentAnim === 'dance') {
            targetPos.set(Math.sin(time * 0.35) * 0.55, 1.55, 3.4);
        }

        targetPos.y += Math.sin(time * 0.4) * 0.03;
        this.camera.position.lerp(targetPos, smoothing);
        this.camera.lookAt(targetLook);
    }

    animate() {
        if (!this.renderer) return;
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        this.elapsed += delta;

        if (this.mixer) this.mixer.update(delta * 0.85);
        this.updateRig(this.elapsed, delta);
        this.updateStageEffects(this.elapsed, delta);
        this.updateCamera(this.elapsed, delta);

        this.renderer.render(this.scene, this.camera);
    }

    resize() {
        if (!this.canvas || !this.renderer) return;
        const width = this.canvas.clientWidth || this.canvas.parentElement?.clientWidth || 800;
        const height = this.canvas.clientHeight || this.canvas.parentElement?.clientHeight || 400;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }
}

window.Kinetics3D = Kinetics3D;
