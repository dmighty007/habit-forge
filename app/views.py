from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.models import User
from .models import Habit, Reward, UserProfile, EvidenceRecord, Todo
import json
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from datetime import timedelta


def get_demo_user():
    user, created = User.objects.get_or_create(username='demo')
    if created:
        user.set_password('password123')
        user.save()
        # Seed starter habits
        Habit.objects.create(
            user=user, name='Draft 1 Sentence',
            sustainable='Just open the doc', reward=5,
            streak=2, energy_required='low'
        )
        Habit.objects.create(
            user=user, name='Deep Work Session',
            sustainable='5 mins focus', reward=15,
            streak=5, energy_required='high'
        )
        Habit.objects.create(
            user=user, name='Morning Sunlight',
            sustainable='Look out window', reward=5,
            streak=10, energy_required='low', is_micro_ritual=True
        )
        # Seed rewards
        Reward.objects.create(user=user, name='30m Gaming', cost=50)
        Reward.objects.create(user=user, name='Premium Coffee', cost=25)
    return user


def index(request):
    return render(request, 'habit_forge/index.html')


def get_data(request):
    user = get_demo_user()
    profile = user.userprofile

    # Adaptive Momentum: Decay streaks for habits not done in > 36 hours
    now = timezone.now()
    stale = user.habits.filter(last_done__lt=now - timedelta(hours=36))
    for habit in stale:
        habit.streak = max(0, habit.streak * 0.8)
        habit.save()

    habits = list(user.habits.all().values(
        'id', 'name', 'sustainable', 'reward', 'streak',
        'last_done', 'energy_required', 'is_micro_ritual'
    ))
    rewards = list(user.rewards.all().values('id', 'name', 'cost', 'unlocked'))
    evidence = list(
        user.evidence.all().order_by('-timestamp')[:5]
        .values('id', 'title', 'description', 'timestamp')
    )
    todos = list(
        user.todos.filter(is_completed=False)
        .order_by('-created_at')
        .values('id', 'title', 'energy_required')
    )

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
    })


@csrf_exempt
def update_energy(request):
    if request.method == 'POST':
        user = get_demo_user()
        data = json.loads(request.body)
        profile = user.userprofile
        profile.energy_level = data.get('energy', 100)
        profile.save()
        return JsonResponse({'status': 'ok', 'energy': profile.energy_level})
    return JsonResponse({'status': 'error'}, status=400)


@csrf_exempt
def add_habit(request):
    if request.method == 'POST':
        user = get_demo_user()
        data = json.loads(request.body)
        habit = Habit.objects.create(
            user=user,
            name=data.get('name'),
            sustainable=data.get('sustainable'),
            reward=data.get('reward', 5),
            energy_required=data.get('energy_required', 'med'),
            is_micro_ritual=data.get('is_micro_ritual', False),
        )
        return JsonResponse({'status': 'ok', 'id': habit.id})
    return JsonResponse({'status': 'error'}, status=400)


@csrf_exempt
def complete_habit(request, habit_id):
    if request.method == 'POST':
        user = get_demo_user()
        habit = get_object_or_404(Habit, id=habit_id, user=user)
        habit.streak += 1
        habit.last_done = timezone.now()
        habit.save()

        profile = user.userprofile
        profile.essence += habit.reward
        profile.focus_points += 10
        profile.save()

        EvidenceRecord.objects.create(
            user=user,
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
def water_tree(request):
    if request.method == 'POST':
        user = get_demo_user()
        profile = user.userprofile
        if profile.essence >= 10:
            profile.essence -= 10
            profile.tree_progress += 20
            if profile.tree_progress >= 100:
                profile.tree_progress = 0
                if profile.tree_stage < 5:
                    profile.tree_stage += 1
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
def add_todo(request):
    if request.method == 'POST':
        user = get_demo_user()
        data = json.loads(request.body)
        title = data.get('title', '').strip()
        if not title:
            return JsonResponse({'status': 'error', 'msg': 'Title required'}, status=400)
        Todo.objects.create(
            user=user,
            title=title,
            energy_required=data.get('energy_required', 'med'),
        )
        return JsonResponse({'status': 'ok'})
    return JsonResponse({'status': 'error'}, status=400)


@csrf_exempt
def toggle_todo(request, todo_id):
    if request.method == 'POST':
        user = get_demo_user()
        todo = get_object_or_404(Todo, id=todo_id, user=user)
        todo.is_completed = not todo.is_completed
        todo.save()
        if todo.is_completed:
            profile = user.userprofile
            profile.focus_points += 2
            profile.save()
        return JsonResponse({'status': 'ok'})
    return JsonResponse({'status': 'error'}, status=400)


# ─── HEALTHY WEEK SEEDING ───

@csrf_exempt
def seed_healthy_week(request):
    if request.method == 'POST':
        user = get_demo_user()

        # Seed rituals (use defaults to avoid duplicate-key issues)
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

        # Seed daily focus tasks
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
