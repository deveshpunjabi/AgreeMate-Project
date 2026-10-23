"""Catch migration errors in deferred imports that route smoke tests cannot reach."""
import ast
import importlib
from pathlib import Path


def test_internal_imports_resolve():
    app_root = Path(__file__).resolve().parents[2] / "app"
    failures = []
    for source in app_root.rglob("*.py"):
        tree = ast.parse(source.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if not isinstance(node, ast.ImportFrom) or not (node.module or "").startswith("backend.app"):
                continue
            try:
                module = importlib.import_module(node.module)
                for alias in node.names:
                    if alias.name != "*" and not hasattr(module, alias.name):
                        failures.append(f"{source.name}:{node.lineno}: missing {node.module}.{alias.name}")
            except ImportError as error:
                failures.append(f"{source.name}:{node.lineno}: {error}")
    assert not failures, "\n".join(failures)
