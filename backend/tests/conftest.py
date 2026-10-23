import os
import sys

# Tests must never inherit database or delivery credentials from a developer's .env.
os.environ.update({
    "MONGODB_URL": "mongodb://127.0.0.1:27017/agreemate_test",
    "DATABASE_NAME": "agreemate_test",
    "JWT_SECRET": "agreemate-test-only-secret-at-least-32-characters",
    "ENVIRONMENT": "development",
    "SMTP_USERNAME": "",
    "SMTP_PASSWORD": "",
    "CLOUDINARY_CLOUD_NAME": "",
    "CLOUDINARY_API_KEY": "",
    "CLOUDINARY_API_SECRET": "",
    "ENABLE_IN_PROCESS_SCHEDULER": "false",
})

# Add the project root to sys.path so backend is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
