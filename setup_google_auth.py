import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.sites.models import Site
from allauth.socialaccount.models import SocialApp

def setup_google_auth():
    # 1. Setup Site
    site, created = Site.objects.get_or_create(id=1, defaults={'domain': 'localhost:8000', 'name': 'Habit Forge Pro'})
    if not created:
        site.domain = 'localhost:9099'
        site.name = 'Habit Forge Pro'
        site.save()
    print(f"Site configured: {site.domain}")

    # 2. Setup SocialApp for Google
    google_app, created = SocialApp.objects.get_or_create(
        provider='google',
        name='Google Auth',
        defaults={
            'client_id': 'PLACEHOLDER_CLIENT_ID',
            'secret': 'PLACEHOLDER_SECRET',
        }
    )
    google_app.sites.add(site)
    if created:
        print("Google SocialApp created with placeholders.")
    else:
        print("Google SocialApp already exists.")

if __name__ == '__main__':
    setup_google_auth()
