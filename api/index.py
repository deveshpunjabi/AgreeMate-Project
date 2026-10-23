import os
import sys

# Ensure repository root and backend directory are on sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")
for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.main import app

# Export app as ASGI handler for Vercel Serverless Function
__all__ = ["app"]
