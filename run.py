import os
import sys
import subprocess
import signal
import time
import re
import shutil
import argparse
import threading
import urllib.request
import urllib.error

if sys.platform == "win32":
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
    except Exception:
        pass
    os.system("")

CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
MAGENTA = "\033[95m"
RED = "\033[91m"
BLUE = "\033[94m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

stop_event = threading.Event()
active_processes = {}
process_lock = threading.Lock()


def free_ports(ports=(3000, 3001, 8000)):
    killed_pids = set()
    my_pid = os.getpid()

    if sys.platform == "win32":
        try:
            res = subprocess.run(
                ["netstat", "-ano", "-p", "tcp"],
                capture_output=True,
                text=True,
                check=False
            )
            for line in res.stdout.splitlines():
                if "LISTENING" in line:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        local_addr = parts[1]
                        pid_str = parts[-1]
                        for port in ports:
                            if local_addr.endswith(f":{port}") or local_addr.endswith(f"[{port}]"):
                                try:
                                    pid = int(pid_str)
                                    if pid != 0 and pid != my_pid and pid not in killed_pids:
                                        print(f"{YELLOW}[PORT]{RESET} Releasing process {pid} on port {port}...", flush=True)
                                        subprocess.run(
                                            ["taskkill", "/F", "/T", "/PID", str(pid)],
                                            capture_output=True,
                                            text=True,
                                            check=False
                                        )
                                        killed_pids.add(pid)
                                except ValueError:
                                    pass
        except Exception as e:
            print(f"{RED}[PORT]{RESET} Port check error: {e}", flush=True)
    else:
        for port in ports:
            try:
                out = subprocess.run(["lsof", "-ti", f":{port}"], capture_output=True, text=True, check=False)
                for pid_str in out.stdout.strip().split():
                    if pid_str.isdigit():
                        pid = int(pid_str)
                        if pid != my_pid and pid not in killed_pids:
                            print(f"{YELLOW}[PORT]{RESET} Releasing process {pid} on port {port}...", flush=True)
                            subprocess.run(["kill", "-9", str(pid)], capture_output=True, check=False)
                            killed_pids.add(pid)
            except Exception:
                pass

    if killed_pids:
        time.sleep(0.3)
        print(f"{GREEN}[PORT]{RESET} Port cleanup complete.\n", flush=True)


def stream_logs(process, prefix_name, color_code, url_callback=None):
    try:
        for line in iter(process.stdout.readline, ""):
            if stop_event.is_set():
                break
            if not line:
                break
            line_str = line.rstrip()
            if line_str:
                if url_callback:
                    match = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line_str)
                    if match:
                        url_callback(match.group(0))
                print(f"{color_code}[{prefix_name}]{RESET} {line_str}", flush=True)
    except Exception:
        pass


def kill_proc_tree(pid):
    try:
        if sys.platform == "win32":
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False
            )
        else:
            os.killpg(os.getpgid(pid), signal.SIGTERM)
    except Exception:
        pass


def signal_handler(sig=None, frame=None):
    if stop_event.is_set():
        return
    stop_event.set()

    print(f"\n{YELLOW}[SYSTEM]{RESET} Shutting down dev servers...", flush=True)

    with process_lock:
        for name, proc in active_processes.items():
            if proc and proc.poll() is None:
                try:
                    kill_proc_tree(proc.pid)
                    proc.terminate()
                except Exception:
                    pass

    time.sleep(0.2)
    with process_lock:
        for name, proc in active_processes.items():
            if proc and proc.poll() is None:
                try:
                    proc.kill()
                except Exception:
                    pass

    free_ports([3000, 3001, 8000])
    print(f"{GREEN}[SYSTEM]{RESET} All processes stopped cleanly.", flush=True)
    sys.exit(0)


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)
if sys.platform == "win32" and hasattr(signal, "SIGBREAK"):
    signal.signal(signal.SIGBREAK, signal_handler)


def check_health(backend_port, frontend_port):
    backend_ready = False
    frontend_ready = False

    for _ in range(60):
        if stop_event.is_set():
            return

        if not backend_ready:
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{backend_port}/health", timeout=1.0) as res:
                    if res.status == 200:
                        backend_ready = True
                        print(f"{GREEN}[BACKEND]{RESET} Ready at http://127.0.0.1:{backend_port} (Docs: http://127.0.0.1:{backend_port}/docs)", flush=True)
            except Exception:
                try:
                    with urllib.request.urlopen(f"http://127.0.0.1:{backend_port}/docs", timeout=1.0) as res:
                        if res.status == 200:
                            backend_ready = True
                            print(f"{GREEN}[BACKEND]{RESET} Ready at http://127.0.0.1:{backend_port} (Docs: http://127.0.0.1:{backend_port}/docs)", flush=True)
                except Exception:
                    pass

        if not frontend_ready:
            try:
                with urllib.request.urlopen(f"http://localhost:{frontend_port}", timeout=1.0) as res:
                    if res.status in (200, 307, 308, 404):
                        frontend_ready = True
                        print(f"{GREEN}[FRONTEND]{RESET} Ready at http://localhost:{frontend_port}", flush=True)
            except Exception:
                pass

        if backend_ready and frontend_ready:
            break

        time.sleep(0.8)


def supervisor_loop(service_key, start_fn, auto_restart=True):
    consecutive_crashes = 0

    while not stop_event.is_set():
        proc = start_fn()
        if not proc:
            time.sleep(2.0)
            continue

        with process_lock:
            active_processes[service_key] = proc

        ret = proc.wait()

        if stop_event.is_set():
            break

        print(f"{YELLOW}[{service_key}]{RESET} Exited (code {ret})", flush=True)

        if not auto_restart:
            break

        consecutive_crashes += 1
        if consecutive_crashes >= 5:
            print(f"{RED}[{service_key}]{RESET} Max crash restarts reached. Halting.", flush=True)
            break

        backoff = min(1.5 * consecutive_crashes, 8)
        time.sleep(backoff)


def find_python_executable(root_dir, backend_dir):
    candidates = []
    if sys.platform == "win32":
        candidates = [
            os.path.join(backend_dir, "venv", "Scripts", "python.exe"),
            os.path.join(backend_dir, ".venv", "Scripts", "python.exe"),
            os.path.join(root_dir, "venv", "Scripts", "python.exe"),
            os.path.join(root_dir, ".venv", "Scripts", "python.exe"),
        ]
    else:
        candidates = [
            os.path.join(backend_dir, "venv", "bin", "python"),
            os.path.join(backend_dir, ".venv", "bin", "python"),
            os.path.join(root_dir, "venv", "bin", "python"),
            os.path.join(root_dir, ".venv", "bin", "python"),
        ]

    for cand in candidates:
        if os.path.isfile(cand):
            return cand
    return sys.executable


def find_frontend_command(frontend_dir, port):
    # Fast path: use node to run next binary directly without npx overhead
    next_bin = os.path.join(frontend_dir, "node_modules", "next", "dist", "bin", "next")
    if os.path.isfile(next_bin):
        node_exe = shutil.which("node") or "node"
        return [node_exe, next_bin, "dev", "-p", str(port)]

    # Fallback to local next cmd
    if sys.platform == "win32":
        local_cmd = os.path.join(frontend_dir, "node_modules", ".bin", "next.cmd")
        if os.path.isfile(local_cmd):
            return [local_cmd, "dev", "-p", str(port)]
        return ["npm.cmd", "run", "dev", "--", "-p", str(port)]
    else:
        local_bin = os.path.join(frontend_dir, "node_modules", ".bin", "next")
        if os.path.isfile(local_bin):
            return [local_bin, "dev", "-p", str(port)]
        return ["npm", "run", "dev", "--", "-p", str(port)]


def main():
    parser = argparse.ArgumentParser(description="AgreeMate Dev Runner")
    parser.add_argument("--tunnel", "-t", action="store_true", help="Start Cloudflare quick tunnel")
    parser.add_argument("--no-kill", action="store_true", help="Do not kill existing processes on ports")
    parser.add_argument("--clean-only", action="store_true", help="Free ports and exit immediately")
    parser.add_argument("--port", type=int, default=3000, help="Frontend port (default: 3000)")
    parser.add_argument("--backend-port", type=int, default=8000, help="Backend port (default: 8000)")
    parser.add_argument("--no-restart", action="store_true", help="Disable auto-restart on process exit")
    args = parser.parse_args()

    if not args.no_kill or args.clean_only:
        free_ports([args.port, args.port + 1, args.backend_port])
        if args.clean_only:
            return

    root_dir = os.path.abspath(os.path.dirname(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    venv_python = find_python_executable(root_dir, backend_dir)

    print(f"\n{BOLD}AgreeMate Development Environment{RESET}")
    print(f"  Frontend: http://localhost:{args.port}")
    print(f"  Backend:  http://127.0.0.1:{args.backend_port}")
    print(f"  Docs:     http://127.0.0.1:{args.backend_port}/docs\n")

    threading.Thread(
        target=check_health,
        args=(args.backend_port, args.port),
        daemon=True
    ).start()

    def start_backend():
        backend_env = os.environ.copy()
        backend_env["PYTHONPATH"] = root_dir
        backend_env["PYTHONUNBUFFERED"] = "1"
        try:
            proc = subprocess.Popen(
                [venv_python, "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", str(args.backend_port), "--reload"],
                cwd=root_dir,
                env=backend_env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                encoding="utf-8",
                errors="replace"
            )
            threading.Thread(
                target=stream_logs,
                args=(proc, "BACKEND", CYAN),
                daemon=True
            ).start()
            return proc
        except Exception as e:
            print(f"{RED}[BACKEND]{RESET} Failed to start: {e}", flush=True)
            return None

    def start_frontend():
        frontend_env = os.environ.copy()
        frontend_env["FORCE_COLOR"] = "1"
        frontend_env["PORT"] = str(args.port)

        env_file = os.path.join(root_dir, ".env")
        if os.path.exists(env_file):
            try:
                with open(env_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            key, _, value = line.partition("=")
                            frontend_env[key.strip()] = value.strip()
            except Exception:
                pass

        # Clean any stale/corrupted Turbopack dev cache before launching Next.js
        stale_dev_cache = os.path.join(frontend_dir, ".next", "dev")
        if os.path.isdir(stale_dev_cache):
            try:
                shutil.rmtree(stale_dev_cache, ignore_errors=True)
            except Exception:
                pass

        cmd = find_frontend_command(frontend_dir, args.port)

        try:
            proc = subprocess.Popen(
                cmd,
                cwd=frontend_dir,
                env=frontend_env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                encoding="utf-8",
                errors="replace"
            )
            threading.Thread(
                target=stream_logs,
                args=(proc, "FRONTEND", MAGENTA),
                daemon=True
            ).start()
            return proc
        except Exception as e:
            print(f"{RED}[FRONTEND]{RESET} Failed to start: {e}", flush=True)
            return None

    threading.Thread(
        target=supervisor_loop,
        args=("BACKEND", start_backend, not args.no_restart),
        daemon=True
    ).start()

    threading.Thread(
        target=supervisor_loop,
        args=("FRONTEND", start_frontend, not args.no_restart),
        daemon=True
    ).start()

    if args.tunnel:
        def on_public_url(url):
            print(f"\n{BOLD}{GREEN}[TUNNEL]{RESET} Public URL: {url}\n", flush=True)

        def start_tunnel():
            cloudflared_bin = shutil.which("cloudflared") or shutil.which("cloudflared.exe") or "cloudflared"
            try:
                proc = subprocess.Popen(
                    [cloudflared_bin, "tunnel", "--url", f"http://localhost:{args.port}"],
                    cwd=root_dir,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1,
                    encoding="utf-8",
                    errors="replace"
                )
                threading.Thread(
                    target=stream_logs,
                    args=(proc, "TUNNEL", YELLOW, on_public_url),
                    daemon=True
                ).start()
                return proc
            except Exception as e:
                print(f"{RED}[TUNNEL]{RESET} Failed to launch: {e}", flush=True)
                return None

        threading.Thread(
            target=supervisor_loop,
            args=("TUNNEL", start_tunnel, False),
            daemon=True
        ).start()

    try:
        while not stop_event.is_set():
            time.sleep(0.5)
    except KeyboardInterrupt:
        signal_handler()


if __name__ == "__main__":
    main()
