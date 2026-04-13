from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/data/', views.get_data, name='get_data'),
    path('api/habits/add/', views.add_habit, name='add_habit'),
    path('api/habits/complete/<int:habit_id>/', views.complete_habit, name='complete_habit'),
    path('api/tree/water/', views.water_tree, name='water_tree'),
    path('api/energy/update/', views.update_energy, name='update_energy'),
    path('api/todos/add/', views.add_todo, name='add_todo'),
    path('api/todos/toggle/<int:todo_id>/', views.toggle_todo, name='toggle_todo'),
    path('api/seed-healthy-week/', views.seed_healthy_week, name='seed_healthy_week'),
]
