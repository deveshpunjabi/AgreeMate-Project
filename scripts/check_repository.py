"""Check tracked files and imports for accidental local artifacts or legacy copies."""
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
FORBIDDEN_PARTS = {".agents", ".codex", ".planning", ".venv", "node_modules", ".next", "__pycache__", "graphify-out", ".cache"}
LEGACY = re.compile(
    r"backend\.app\.(?:auth|agreements|admin|items|evidence|notifications|penalties|reminders|security|users|config|database|email_service)(?:\.|\b)"
    r"|@/lib/(?:store|hooks)|@/components/(?:app|agreements)/"
)


def main():
    files = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode().split("\0")
    problems = []
    # Vercel's function packager requires self-contained dependency manifests.
    def requirements(name):
        return [line.strip() for line in (ROOT / name).read_text(encoding="utf-8").splitlines()
                if line.strip() and not line.lstrip().startswith("#")]

    canonical = requirements("backend/requirements.txt")
    for manifest in ("requirements.txt", "api/requirements.txt"):
        if requirements(manifest) != canonical:
            problems.append(f"Deployment dependencies differ from backend/requirements.txt: {manifest}")
    for name in filter(None, files):
        path = ROOT / name
        if not path.is_file():
            continue
        if (FORBIDDEN_PARTS.intersection(path.relative_to(ROOT).parts)
                or name.startswith(("docs/plans/", "docs/superpowers/"))
                or (path.name.startswith(".env") and path.name != ".env.example")
                or path.suffix in {".pem", ".key", ".pyc", ".log"}):
            problems.append(f"Local artifact tracked: {name}")
        if path.suffix in {".py", ".ts", ".tsx"} and name != "scripts/check_repository.py":
            for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
                if LEGACY.search(line):
                    problems.append(f"Legacy reference: {name}:{number}")
    for problem in problems:
        print(problem)
    print(f"Repository hygiene: {len(problems)} problem(s)")
    return bool(problems)


if __name__ == "__main__":
    raise SystemExit(main())
