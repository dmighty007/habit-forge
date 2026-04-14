window.KINETICS_CAMPAIGN = [
    {
        level: 1,
        title: "Day 1: Full Body Start",
        objective: "Activate major muscle groups with a balanced foundational circuit.",
        microHabit: "2-minute version: 5 Push-ups + 10 Squats.",
        exercises: [
            {
                id: "d1_1",
                name: "Push-ups",
                sets: "3 sets of 6-8",
                rest: "60s",
                instruction: "Plank position, lower chest to floor, push back up.",
                cue: "Push the world away.",
                easier: "Wall Push-ups",
                harder: "Slow eccentric (3s down)",
                xp: 50,
                essence: 15,
                anim: "pushup",
                ui: { particles: "blue_aura", color: "#4FC3F7" }
            },
            {
                id: "d1_2",
                name: "Bodyweight Squats",
                sets: "3 sets of 10-12",
                rest: "60s",
                instruction: "Sit back into hips, keep chest high, feet flat.",
                cue: "Sit into a phantom chair.",
                easier: "Chair Sit-to-Stands",
                harder: "Squat Hold at bottom",
                xp: 50,
                essence: 15,
                anim: "squat",
                ui: { particles: "yellow_sparks", color: "#FFF176" }
            },
            {
                id: "d1_3",
                name: "Plank",
                sets: "3 sets of 20s",
                rest: "45s",
                instruction: "Hold straight line from head to heels on elbows.",
                cue: "Squeeze everything hard.",
                easier: "Knee Plank",
                harder: "Plank Shoulder Taps",
                xp: 40,
                essence: 10,
                anim: "plank",
                ui: { particles: "green_shield", color: "#81C784" }
            },
            {
                id: "d1_4",
                name: "Jumping Jacks",
                sets: "2 sets of 30s",
                rest: "30s",
                instruction: "Jump feet out and hands up together.",
                cue: "Stay light on your feet.",
                easier: "Stepping Jacks",
                harder: "Star Jumps",
                xp: 30,
                essence: 5,
                anim: "jacks",
                ui: { particles: "orange_flare", color: "#FFB74D" }
            }
        ]
    },
    {
        level: 2,
        title: "Day 2: Upper Body Focus",
        objective: "Target push-pull movements to build upper body volume.",
        microHabit: "2-minute version: 10 Incline Push-ups.",
        exercises: [
            {
                id: "d2_1",
                name: "Incline Push-ups",
                sets: "3 sets of 8-10",
                rest: "60s",
                instruction: "Hands on a table or sofa, perform push-up.",
                cue: "Elbows at 45 degrees.",
                easier: "Wall Push-ups",
                harder: "Standard Push-ups",
                xp: 50,
                essence: 15,
                anim: "pushup_incline",
                ui: { particles: "blue_beams", color: "#00E5FF" }
            },
            {
                id: "d2_2",
                name: "Chair Dips",
                sets: "3 sets of 6-8",
                rest: "60s",
                instruction: "Hands on chair edge, lower and push back up.",
                cue: "Keep back close to the chair.",
                easier: "Bent knee Dips",
                harder: "Straight leg Dips",
                xp: 50,
                essence: 15,
                anim: "dips",
                ui: { particles: "cyan_pulse", color: "#18FFFF" }
            },
            {
                id: "d2_3",
                name: "Rows (Band/Dumbbell)",
                sets: "3 sets of 10",
                rest: "60s",
                instruction: "Pull weight/band toward your hip, squeeze blade.",
                cue: "Elbow to the ceiling.",
                easier: "Single arm supported row",
                harder: "Slow tempo (3s pull)",
                xp: 50,
                essence: 15,
                anim: "row",
                ui: { particles: "purple_void", color: "#E040FB" }
            },
            {
                id: "d2_4",
                name: "Bicep Curls",
                sets: "3 sets of 10",
                rest: "45s",
                instruction: "Curl weight toward shoulders, slow on way down.",
                cue: "Don't swing your elbows.",
                easier: "Lighter weight",
                harder: "Hammer curls",
                xp: 40,
                essence: 10,
                anim: "curl",
                ui: { particles: "pink_glow", color: "#FF4081" }
            }
        ]
    },
    {
        level: 3,
        title: "Day 3: Legs and Core",
        objective: "Focus on lower body hypertrophy and deep core tension.",
        microHabit: "2-minute version: 10 Glute Bridges.",
        exercises: [
            {
                id: "d3_1",
                name: "Lunges",
                sets: "3 sets of 8 each leg",
                rest: "60s",
                instruction: "Step forward, drop back knee, return to center.",
                cue: "Stay balanced and upright.",
                easier: "Reverse Lunges (easier on knees)",
                harder: "Deficit Lunges",
                xp: 60,
                essence: 20,
                anim: "lunge",
                ui: { particles: "gold_dust", color: "#FFD700" }
            },
            {
                id: "d3_2",
                name: "Glute Bridge",
                sets: "3 sets of 12",
                rest: "45s",
                instruction: "Lie on back, lift hips high, squeeze glutes.",
                cue: "Drive through your heels.",
                easier: "Narrow stance bridge",
                harder: "Single leg bridge",
                xp: 40,
                essence: 10,
                anim: "bridge",
                ui: { particles: "peach_bloom", color: "#FF8A65" }
            },
            {
                id: "d3_3",
                name: "Calf Raises",
                sets: "3 sets of 15",
                rest: "30s",
                instruction: "Stand on toes, hold 1s, lower slowly.",
                cue: "Go as high as possible.",
                easier: "Seated calf raises",
                harder: "Single leg calf raises",
                xp: 30,
                essence: 5,
                anim: "calf_raise",
                ui: { particles: "silver_mist", color: "#BDBDBD" }
            },
            {
                id: "d3_4",
                name: "Leg Raises",
                sets: "3 sets of 10",
                rest: "60s",
                instruction: "Lie on back, lift legs toward sky, lower slowly.",
                cue: "Keep your lower back flat on floor.",
                easier: "Bent knee tucks",
                harder: "Straight leg raises",
                xp: 50,
                essence: 15,
                anim: "leg_raise",
                ui: { particles: "emerald_flash", color: "#00C853" }
            }
        ]
    },
    {
        level: 4,
        title: "Day 4: Recovery and Mobility",
        objective: "Active recovery to allow muscle repair and weight gain.",
        microHabit: "2-minute version: 5 deep breaths + 1 stretch.",
        exercises: [
            {
                id: "d4_1",
                name: "Full Body Stretching",
                sets: "10-15 min",
                rest: "N/A",
                instruction: "Move through gentle neck, shoulder, and hip stretches.",
                cue: "Relax into the pull.",
                easier: "Seated stretches",
                harder: "Deep hold (30s+)",
                xp: 40,
                essence: 10,
                anim: "stretch",
                ui: { particles: "zen_circles", color: "#81D4FA" }
            },
            {
                id: "d4_2",
                name: "Light Walking",
                sets: "15-20 min",
                rest: "N/A",
                instruction: "A gentle stroll to keep blood flowing.",
                cue: "Focus on your surroundings.",
                easier: "5 min walk",
                harder: "Brisk pace",
                xp: 30,
                essence: 5,
                anim: "walk",
                ui: { particles: "leaf_drift", color: "#AED581" }
            },
            {
                id: "d4_3",
                name: "Deep Breathing",
                sets: "5 min",
                rest: "N/A",
                instruction: "Breathe in 4s, hold 4s, out 4s.",
                cue: "Breathe into your belly.",
                easier: "2 min session",
                harder: "10 min session",
                xp: 40,
                essence: 20,
                anim: "breathe",
                ui: { particles: "cloud_wisps", color: "#E1F5FE" }
            }
        ]
    },
    {
        level: 5,
        title: "Day 5: Full Body Progression",
        objective: "Slightly increase intensity to trigger hypertrophy.",
        microHabit: "2-minute version: 5 Squat Jumps.",
        exercises: [
            {
                id: "d5_1",
                name: "Push-ups",
                sets: "3 sets of 8-10",
                rest: "60s",
                instruction: "Standard push-ups with focus on form.",
                cue: "Stiff as a board.",
                easier: "Incline push-ups",
                harder: "Diamond push-ups",
                xp: 60,
                essence: 20,
                anim: "pushup",
                ui: { particles: "lava_flow", color: "#FF5252" }
            },
            {
                id: "d5_2",
                name: "Squat Jumps",
                sets: "3 sets of 6-8",
                rest: "60s",
                instruction: "Squat down, explode up, land softly.",
                cue: "Land like a cat.",
                easier: "Power Squats (no jump)",
                harder: "Tuck Jumps",
                xp: 70,
                essence: 25,
                anim: "jump_squat",
                ui: { particles: "thunder_bolt", color: "#FFD600" }
            },
            {
                id: "d5_3",
                name: "Plank Shoulder Taps",
                sets: "3 sets of 10 per side",
                rest: "45s",
                instruction: "In high plank, tap opposite shoulder.",
                cue: "Stop your hips from rocking.",
                easier: "Plank hold",
                harder: "Plank Reach",
                xp: 50,
                essence: 15,
                anim: "plank_taps",
                ui: { particles: "matrix_code", color: "#64DD17" }
            },
            {
                id: "d5_4",
                name: "Mountain Climbers",
                sets: "3 sets of 20s",
                rest: "45s",
                instruction: "In plank, drive knees toward chest fast.",
                cue: "Running against the floor.",
                easier: "Slow march",
                harder: "Spider climbers",
                xp: 50,
                essence: 15,
                anim: "climber",
                ui: { particles: "comet_tail", color: "#FF6D00" }
            }
        ]
    },
    {
        level: 6,
        title: "Day 6: Strength and Control",
        objective: "Slow down the movements for maximum tension and time-under-load.",
        microHabit: "2-minute version: 3 Slow Push-ups.",
        exercises: [
            {
                id: "d6_1",
                name: "Slow Push-ups",
                sets: "3 sets of 5-6",
                rest: "90s",
                instruction: "3 seconds down, 1 second hold, 1 second up.",
                cue: "Feel the burn.",
                easier: "Slow wall push-ups",
                harder: "Slow diamond push-ups",
                xp: 70,
                essence: 30,
                anim: "pushup_slow",
                ui: { particles: "ice_shards", color: "#40C4FF" }
            },
            {
                id: "d6_2",
                name: "Slow Squats",
                sets: "3 sets of 10",
                rest: "90s",
                instruction: "3 seconds down, 1 second hold, 1 second up.",
                cue: "Control the descent.",
                easier: "Slow box squats",
                harder: "Slow pause squats",
                xp: 60,
                essence: 25,
                anim: "squat_slow",
                ui: { particles: "glacial_mist", color: "#E1F5FE" }
            },
            {
                id: "d6_3",
                name: "Wall Sit",
                sets: "3 sets of 30s",
                rest: "60s",
                instruction: "Sit against a wall, thighs parallel to floor.",
                cue: "Steady as a mountain.",
                easier: "High wall sit",
                harder: "Single leg wall sit",
                xp: 50,
                essence: 20,
                anim: "wall_sit",
                ui: { particles: "stone_crush", color: "#9E9E9E" }
            },
            {
                id: "d6_4",
                name: "Side Plank",
                sets: "2 sets of 20s per side",
                rest: "45s",
                instruction: "Prop yourself on one elbow, body straight.",
                cue: "Lifting those hips high.",
                easier: "Knee side plank",
                harder: "Side plank dips",
                xp: 50,
                essence: 20,
                anim: "side_plank",
                ui: { particles: "plasma_field", color: "#AA00FF" }
            }
        ]
    },
    {
        level: 7,
        title: "Day 7: Light and Fun Activity",
        objective: "Keep the momentum without high stress. Have fun!",
        microHabit: "2-minute version: 1 minute of dancing.",
        exercises: [
            {
                id: "d7_1",
                name: "Free Movement (Jog/Skip/Dance)",
                sets: "15-20 min",
                rest: "N/A",
                instruction: "Choose any light activity you enjoy.",
                cue: "Just keep moving.",
                easier: "5 min session",
                harder: "Skill training",
                xp: 100,
                essence: 40,
                anim: "dance",
                ui: { particles: "confetti", color: "#FF4081" }
            },
            {
                id: "d7_2",
                name: "Easy Stretching",
                sets: "5-10 min",
                rest: "N/A",
                instruction: "Gentle stretches to close the week.",
                cue: "Thank your body.",
                easier: "3 min session",
                harder: "Yogic holds",
                xp: 40,
                essence: 10,
                anim: "stretch_easy",
                ui: { particles: "stardust", color: "#FFF9C4" }
            }
        ]
    }
];

window.KINETICS_META = {
    progression: "Increase reps slightly each week or add one extra set when it feels easier.",
    diet: "Eat more calories than you burn. Include milk, eggs, bananas, rice/roti, and peanuts daily. Aim for consistent meals and protein intake."
};
