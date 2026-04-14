from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    essence = models.IntegerField(default=10)
    tree_progress = models.IntegerField(default=0)
    tree_stage = models.IntegerField(default=0)
    energy_level = models.IntegerField(default=100) # 0-100
    focus_points = models.IntegerField(default=0)
    vacation_mode_until = models.DateTimeField(null=True, blank=True)
    last_energy_update = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
    else:
        if hasattr(instance, 'userprofile'):
            instance.userprofile.save()

class Habit(models.Model):
    USER_ENERGY_CHOICES = [
        ('low', 'Low Battery'),
        ('med', 'Steady Flow'),
        ('high', 'Hyperfocus'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="habits")
    name = models.CharField(max_length=255)
    sustainable = models.CharField(max_length=255) # The "Tiny Version"
    reward = models.IntegerField(default=5)
    streak = models.FloatField(default=0.0) # Floating point for partial decay
    last_done = models.DateTimeField(null=True, blank=True)
    energy_required = models.CharField(max_length=10, choices=USER_ENERGY_CHOICES, default='med')
    is_micro_ritual = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Reward(models.Model):
    CATEGORY_CHOICES = [
        ('digital', 'Digital (Theme/Audio)'),
        ('personal', 'Personal (Real Life)'),
        ('unlock', 'System Unlock'),
    ]
    RARITY_CHOICES = [
        ('common', 'Common'),
        ('rare', 'Rare'),
        ('legendary', 'Legendary'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="rewards")
    name = models.CharField(max_length=255)
    cost = models.IntegerField(default=50)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='personal')
    rarity = models.CharField(max_length=20, choices=RARITY_CHOICES, default='common')
    unlocked = models.BooleanField(default=False)
    icon = models.CharField(max_length=50, default='🎁')

    def __str__(self):
        return self.name

class Quest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="quests")
    title = models.CharField(max_length=255)
    description = models.TextField()
    is_completed = models.BooleanField(default=False)
    essence_reward = models.IntegerField(default=10)
    date = models.DateField(auto_now_add=True)
    category = models.CharField(max_length=50, default='mindfulness') # mindfulness, health, social

    def __str__(self):
        return self.title

class EvidenceRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="evidence")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    habit_link = models.ForeignKey(Habit, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.title

class Todo(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="todos")
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    energy_required = models.CharField(max_length=10, choices=[('low', 'Low'), ('med', 'Med'), ('high', 'High')], default='med')
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class DailyWin(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="wins")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Win on {self.timestamp.date()}"

class ParkedImpulse(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="impulses")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_processed = models.BooleanField(default=False)

    def __str__(self):
        return f"Impulse by {self.user.username} on {self.timestamp.date()}"

class Achievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="achievements")
    key = models.CharField(max_length=100) # e.g., 'focus_100', 'streak_7'
    title = models.CharField(max_length=255)
    description = models.TextField()
    icon = models.CharField(max_length=50, default='🏆')
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'key')

    def __str__(self):
        return f"{self.title} - {self.user.username}"
