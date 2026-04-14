from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from .models import Habit, Reward, UserProfile, EvidenceRecord, Todo, DailyWin, Quest, ParkedImpulse, Achievement
from .presets import RITUAL_PRESETS, DAILY_QUEST_POOL
import random
import json
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from datetime import timedelta


# ─── AUTH VIEWS ───

def login_view(request):
    if request.user.is_authenticated:
        return redirect('index')

    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('index')
        else:
            return render(request, 'habit_forge/login.html', {
                'error': 'Invalid username or password.',
                'tab': 'login',
                'username': username,
            })

    return render(request, 'habit_forge/login.html', {'tab': 'login'})


def register_view(request):
    if request.user.is_authenticated:
        return redirect('index')

    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')
        password2 = request.POST.get('password2', '')

        errors = []
        if not username:
            errors.append('Username is required.')
        if len(password) < 6:
            errors.append('Password must be at least 6 characters.')
        if password != password2:
            errors.append('Passwords do not match.')
        if User.objects.filter(username=username).exists():
            errors.append('Username already taken.')

        if errors:
            return render(request, 'habit_forge/login.html', {
                'errors': errors,
                'tab': 'register',
                'username': username,
                'email': email,
            })

        user = User.objects.create_user(username=username, email=email, password=password)
        # Seed starter habits for new users
        Habit.objects.create(
            user=user, name='Hydration Flow',
            sustainable='Drink 1 glass of water', reward=5,
            energy_required='low', is_micro_ritual=True
        )
        Habit.objects.create(
            user=user, name='Mindful Movement',
            sustainable='1 minute of stretching', reward=10,
            energy_required='med'
        )
        Reward.objects.create(user=user, name='30m Gaming', cost=50, category='personal', icon='🎮')
        Reward.objects.create(user=user, name='Premium Coffee', cost=25, category='personal', icon='☕')
        Reward.objects.create(user=user, name='Glitch Theme', cost=100, category='digital', rarity='rare', icon='👾')
        Reward.objects.create(user=user, name='Deep Focus Track', cost=150, category='digital', rarity='legendary', icon='🎧')

        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        return redirect('index')

    return render(request, 'habit_forge/login.html', {'tab': 'register'})


def logout_view(request):
    logout(request)
    return redirect('login')


@login_required
def profile_view(request):
    profile = request.user.userprofile
    stats = {
        'total_rituals': request.user.habits.count(),
        'completed_today': request.user.evidence.filter(
            timestamp__date=timezone.now().date()
        ).count(),
        'total_focus': profile.focus_points,
        'total_essence': profile.essence,
        'tree_stage': profile.tree_stage,
        'member_since': request.user.date_joined,
    }
    return render(request, 'habit_forge/profile.html', {
        'stats': stats,
        'profile': profile,
    })


@csrf_exempt
@login_required
def update_profile(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user = request.user
        if 'email' in data:
            user.email = data['email'].strip()
        if 'first_name' in data:
            user.first_name = data['first_name'].strip()
        user.save()
        return JsonResponse({'status': 'ok'})
    return JsonResponse({'status': 'error'}, status=400)


# ─── MAIN VIEWS ───

@login_required
def index(request):
    return render(request, 'habit_forge/index.html')


@login_required
def get_data(request):
    user = request.user
    profile = user.userprofile

    # Adaptive Momentum check: only if not in vacation mode
    now = timezone.now()
    if not profile.vacation_mode_until or profile.vacation_mode_until < now:
        stale = user.habits.filter(last_done__lt=now - timedelta(hours=36))
        for habit in stale:
            habit.streak = max(0, habit.streak * 0.8)
            habit.save()
    
    # Check if vacation mode expired
    vacation_active = False
    if profile.vacation_mode_until and profile.vacation_mode_until > now:
        vacation_active = True

    # ─── DYNAMIC DAILY QUESTS ───
    today = now.date()
    daily_quests = user.quests.filter(date=today)
    if not daily_quests.exists():
        # Pick 3 random quests from the pool
        selected = random.sample(DAILY_QUEST_POOL, 3)
        for q in selected:
            Quest.objects.create(
                user=user, 
                title=q['title'], 
                description=q['desc'], 
                category=q['category'],
                essence_reward=15
            )
        daily_quests = user.quests.filter(date=today)
    
    quests_data = list(daily_quests.values('id', 'title', 'description', 'is_completed', 'essence_reward', 'category'))

    habits = list(user.habits.all().values(
        'id', 'name', 'sustainable', 'reward', 'streak',
        'last_done', 'energy_required', 'is_micro_ritual'
    ))
    rewards = list(user.rewards.all().values('id', 'name', 'cost', 'unlocked', 'category', 'rarity', 'icon'))
    evidence = list(
        user.evidence.all().order_by('-timestamp')[:5]
        .values('id', 'title', 'description', 'timestamp')
    )
    todos = list(
        user.todos.filter(is_completed=False)
        .order_by('-created_at')
        .values('id', 'title', 'energy_required')
    )
    impulses = list(user.impulses.filter(is_processed=False).values('id', 'content', 'timestamp'))
    achievements = list(user.achievements.all().values('id', 'key', 'title', 'description', 'icon', 'unlocked_at'))

    # Automated Achievement Check (Simple)
    check_achievements(user)

    return JsonResponse({
        'essence': profile.essence,
        'treeProgress': profile.tree_progress,
        'treeStage': profile.tree_stage,
        'energyLevel': profile.energy_level,
        'focusPoints': profile.focus_points,
        'habits': habits,
        'rewards': rewards,
        'evidence': evidence,
        'todos': todos,
        'impulses': impulses,
        'achievements': achievements,
        'quests': quests_data,
        'username': user.username,
        'displayName': user.first_name or user.username,
        'vacationActive': vacation_active,
        'vacationUntil': profile.vacation_mode_until.isoformat() if profile.vacation_mode_until else None,
    })


@csrf_exempt
@login_required
def update_energy(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        profile = request.user.userprofile
        profile.energy_level = data.get('energy', 100)
        profile.save()
        return JsonResponse({'status': 'ok', 'energy': profile.energy_level})
    return JsonResponse({'status': 'error'}, status=400)


@csrf_exempt
@login_required
def add_habit(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        habit = Habit.objects.create(
            user=request.user,
            name=data.get('name'),
            sustainable=data.get('sustainable'),
            reward=data.get('reward', 5),
            energy_required=data.get('energy_required', 'med'),
            is_micro_ritual=data.get('is_micro_ritual', False),
        )
        return JsonResponse({'status': 'ok', 'id': habit.id})
    return JsonResponse({'status': 'error'}, status=400)


@csrf_exempt
@login_required
def complete_habit(request, habit_id):
    if request.method == 'POST':
        habit = get_object_or_404(Habit, id=habit_id, user=request.user)
        habit.streak += 1
        habit.last_done = timezone.now()
        habit.save()

        profile = request.user.userprofile
        profile.essence += habit.reward
        profile.focus_points += 10
        profile.save()

        EvidenceRecord.objects.create(
            user=request.user,
            title=f"Conquered: {habit.name}",
            description=f"Level: {habit.energy_required}. Streak reached {habit.streak:.1f}!",
            habit_link=habit,
        )
        return JsonResponse({
            'status': 'ok',
            'essence': profile.essence,
            'focusPoints': profile.focus_points,
        })
    return JsonResponse({'status': 'error'}, status=400)


@csrf_exempt
@login_required
def water_tree(request):
    if request.method == 'POST':
        profile = request.user.userprofile
        if profile.essence >= 10 and profile.tree_progress < 100:
            profile.essence -= 10
            profile.tree_progress += 20
            
            if profile.tree_progress >= 100:
                profile.tree_progress = 100
                profile.tree_stage = 5
            else:
                profile.tree_stage = profile.tree_progress // 20
                
            profile.save()
            return JsonResponse({
                'status': 'ok',
                'essence': profile.essence,
                'treeProgress': profile.tree_progress,
                'treeStage': profile.tree_stage,
            })
    return JsonResponse({'status': 'error'}, status=400)


# ─── TODO ENDPOINTS ───

@csrf_exempt
@login_required
def add_todo(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        title = data.get('title', '').strip()
        if not title:
            return JsonResponse({'status': 'error', 'msg': 'Title required'}, status=400)
        Todo.objects.create(
            user=request.user,
            title=title,
            energy_required=data.get('energy_required', 'med'),
        )
        return JsonResponse({'status': 'ok'})
    return JsonResponse({'status': 'error'}, status=400)


@csrf_exempt
@login_required
def toggle_todo(request, todo_id):
    if request.method == 'POST':
        todo = get_object_or_404(Todo, id=todo_id, user=request.user)
        todo.is_completed = not todo.is_completed
        todo.save()
        if todo.is_completed:
            profile = request.user.userprofile
            profile.focus_points += 2
            profile.save()
        return JsonResponse({'status': 'ok'})
    return JsonResponse({'status': 'error'}, status=400)


# ─── HEALTHY WEEK SEEDING ───

@csrf_exempt
@login_required
def seed_healthy_week(request):
    if request.method == 'POST':
        user = request.user

        healthy_habits = [
            {'name': 'Hydration Flow', 'sustainable': 'Drink 1 glass of water',
             'reward': 5, 'energy_required': 'low', 'is_micro_ritual': True},
            {'name': 'Mindful Movement', 'sustainable': '1 minute of stretching',
             'reward': 10, 'energy_required': 'med', 'is_micro_ritual': False},
            {'name': 'Sleep Hygiene', 'sustainable': 'Phone off 15m before bed',
             'reward': 15, 'energy_required': 'low', 'is_micro_ritual': False},
        ]
        for h in healthy_habits:
            Habit.objects.get_or_create(
                user=user, name=h['name'],
                defaults={
                    'sustainable': h['sustainable'],
                    'reward': h['reward'],
                    'energy_required': h['energy_required'],
                    'is_micro_ritual': h['is_micro_ritual'],
                }
            )

        healthy_todos = [
            'Identify 1 healthy meal for tomorrow',
            'Step outside into sunlight for 5 mins',
            'Deep breathing (5 cycles)',
            'Call/Text 1 person you care about',
        ]
        for title in healthy_todos:
            Todo.objects.get_or_create(
                user=user, title=title,
                defaults={'energy_required': 'low'}
            )

        return JsonResponse({'status': 'seeded'})
    return JsonResponse({'status': 'error'}, status=400)


@csrf_exempt
@login_required
def toggle_vacation_mode(request):
    if request.method == 'POST':
        profile = request.user.userprofile
        now = timezone.now()
        
        if profile.vacation_mode_until and profile.vacation_mode_until > now:
            # Cancel it
            profile.vacation_mode_until = None
        else:
            # Set for 24 hours
            profile.vacation_mode_until = now + timedelta(hours=24)
        
        profile.save()
        return JsonResponse({
            'status': 'ok', 
            'vacationActive': profile.vacation_mode_until is not None,
            'vacationUntil': profile.vacation_mode_until.isoformat() if profile.vacation_mode_until else None
        })
    return JsonResponse({'status': 'error'}, status=400)


@login_required
def get_rhythm_data(request):
    # Get last 30 days of completions
    now = timezone.now()
    start_date = (now - timedelta(days=29)).date()
    
    evidence = request.user.evidence.filter(timestamp__date__gte=start_date)
    
    # Group by date
    rhythm = {}
    for ev in evidence:
        d_str = ev.timestamp.date().isoformat()
        rhythm[d_str] = rhythm.get(d_str, 0) + 1
        
    return JsonResponse({'rhythm': rhythm})


@csrf_exempt
@login_required
def add_daily_win(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        content = data.get('content', '').strip()
        if content:
            DailyWin.objects.create(user=request.user, content=content)
            return JsonResponse({'status': 'ok'})
    return JsonResponse({'status': 'error'}, status=400)

@csrf_exempt
@login_required
def complete_quest(request, quest_id):
    if request.method == 'POST':
        quest = get_object_or_404(Quest, id=quest_id, user=request.user)
        if not quest.is_completed:
            quest.is_completed = True
            quest.save()
            
            profile = request.user.userprofile
            profile.essence += quest.essence_reward
            profile.save()
            
            EvidenceRecord.objects.create(
                user=request.user,
                title=f"Quest Complete: {quest.title}",
                description=f"Earned {quest.essence_reward} essence for mindful consistency."
            )
            return JsonResponse({'status': 'ok', 'essence': profile.essence})
    return JsonResponse({'status': 'error'}, status=400)


@login_required
def get_ritual_presets(request):
    return JsonResponse({'presets': RITUAL_PRESETS})

@csrf_exempt
@login_required
def redeem_reward(request, reward_id):
    if request.method == 'POST':
        reward = get_object_or_404(Reward, id=reward_id, user=request.user)
        profile = request.user.userprofile
        
        if reward.unlocked:
            return JsonResponse({'status': 'error', 'msg': 'Already unlocked!'}, status=400)
            
        if profile.essence >= reward.cost:
            profile.essence -= reward.cost
            reward.unlocked = True
            profile.save()
            reward.save()
            
            EvidenceRecord.objects.create(
                user=request.user,
                title=f"Reward Unlocked: {reward.name}",
                description=f"Redeemed for {reward.cost} essence. {reward.icon}"
            )
            return JsonResponse({'status': 'ok', 'essence': profile.essence})
        else:
            return JsonResponse({'status': 'error', 'msg': 'Not enough essence!'}, status=400)
    return JsonResponse({'status': 'error'}, status=400)

def check_achievements(user):
    profile = user.userprofile
    achievements = []
    
    # Focus 100
    if profile.focus_points >= 100:
        achievements.append({
            'key': 'focus_100',
            'title': 'Focus Adept',
            'description': 'Reached 100 Focus Points. Your mental engine is warming up.',
            'icon': '🔥'
        })
    
    # Focus 500
    if profile.focus_points >= 500:
        achievements.append({
            'key': 'focus_500',
            'title': 'High Fidelity',
            'description': '500 Focus Points. You are becoming one with the flow.',
            'icon': '💎'
        })
        
    # Tree Stage 2
    if profile.tree_stage >= 2:
        achievements.append({
            'key': 'tree_2',
            'title': 'Great Oak',
            'description': 'Your growth tree has reached Stage 2.',
            'icon': '🌳'
        })

    for a in achievements:
        Achievement.objects.get_or_create(
            user=user, key=a['key'],
            defaults={'title': a['title'], 'description': a['description'], 'icon': a['icon']}
        )

@csrf_exempt
@login_required
def save_impulse(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        content = data.get('content', '').strip()
        if content:
            ParkedImpulse.objects.create(user=request.user, content=content)
            return JsonResponse({'status': 'ok'})
    return JsonResponse({'status': 'error'}, status=400)
