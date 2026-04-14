from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),

    # Dashboard
    path('', views.index, name='index'),

    # API
    path('api/data/', views.get_data, name='get_data'),
    path('api/habits/add/', views.add_habit, name='add_habit'),
    path('api/habits/complete/<int:habit_id>/', views.complete_habit, name='complete_habit'),
    path('api/tree/water/', views.water_tree, name='water_tree'),
    path('api/energy/update/', views.update_energy, name='update_energy'),
    path('api/todos/add/', views.add_todo, name='add_todo'),
    path('api/todos/toggle/<int:todo_id>/', views.toggle_todo, name='toggle_todo'),
    path('api/seed-healthy-week/', views.seed_healthy_week, name='seed_healthy_week'),
    path('api/profile/update/', views.update_profile, name='update_profile'),
    path('api/vacation/toggle/', views.toggle_vacation_mode, name='toggle_vacation_mode'),
    path('api/analytics/rhythm/', views.get_rhythm_data, name='get_rhythm_data'),
    path('api/daily-win/add/', views.add_daily_win, name='add_daily_win'),
    path('api/quests/complete/<int:quest_id>/', views.complete_quest, name='complete_quest'),
    path('api/presets/rituals/', views.get_ritual_presets, name='get_ritual_presets'),
    path('api/rewards/redeem/<int:reward_id>/', views.redeem_reward, name='redeem_reward'),
    path('api/impulse/save/', views.save_impulse, name='save_impulse'),
]
