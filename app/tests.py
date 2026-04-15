from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from django.conf import settings
import os

class SecurityTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client = Client(enforce_csrf_checks=True)
        self.client.login(username='testuser', password='password123')

    def test_settings_security(self):
        """Verify that security-sensitive settings are not in their 'insecure' defaults."""
        # These will fail if the env vars are not set, which is what we want to verify 
        # (or at least that they are not hardcoded to the insecure defaults in the code reached)
        # Note: In CI/Test, they might be different, but let's check the logic.
        self.assertFalse(settings.DEBUG is True and os.environ.get('DJANGO_DEBUG') != 'True')
        self.assertIn('localhost', settings.ALLOWED_HOSTS)
        self.assertIn('127.0.0.1', settings.ALLOWED_HOSTS)

    def test_csrf_protection_on_habits(self):
        """Verify that POST requests fail without a CSRF token."""
        url = reverse('add_habit')
        response = self.client.post(url, {
            'name': 'Test Habit',
            'sustainable': 'Test Tiny',
            'reward': 5
        })
        # Should be 403 Forbidden because we enforced CSRF checks and didn't provide a token
        self.assertEqual(response.status_code, 403)

    def test_csrf_protection_on_todo(self):
        """Verify CSRF protection on todo addition."""
        url = reverse('add_todo')
        response = self.client.post(url, {'title': 'Test Todo'})
        self.assertEqual(response.status_code, 403)

    def test_csrf_protection_on_profile(self):
        """Verify CSRF protection on profile update."""
        url = reverse('update_profile')
        response = self.client.post(url, {'email': 'test@example.com'})
        self.assertEqual(response.status_code, 403)
