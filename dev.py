"""
Levantar simultáneamente el Backend y el Frontend
con un solo comando.

se debe usar:
    python dev.py
"""

import os
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

# salida del terminal -colores
COLOR_RESET = "\033[0m"
COLOR_CYAN = "\033[36m"
COLOR_GREEN = "\033[32m"
COLOR_YELLOW = "\033[33m"
COLOR_BOLD = "\033[1m"


def kill_proc_tree(pid: int) -> None:
    """Mata un proceso y todos sus subprocesos hijos (evita puertos ocupados en Windows)."""
    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/F", "/T", "/PID", str(pid)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    else:
        try:
            os.killpg(os.getpgid(pid), signal.SIGTERM)
        except Exception:
            pass


def pipe_output(proc: subprocess.Popen, prefix: str, color: str) -> None:
    """Lee y muestra la salida de un proceso con un prefijo identificado."""
    try:
        assert proc.stdout is not None
        for line in iter(proc.stdout.readline, ""):
            if not line:
                break
            # Limpiar saltos de línea repetidos
            clean_line = line.rstrip("\r\n")
            if clean_line:
                print(f"{color}{prefix}{COLOR_RESET} {clean_line}", flush=True)
    except Exception:
        pass


def main() -> None:
    # nose c olores ANSI en Windows
    if os.name == "nt":
        os.system("color")

    print(f"{COLOR_BOLD}======================================================================{COLOR_RESET}")
    print(f"{COLOR_BOLD}     SISTEMA TEXTILERÍA · SERVIDOR DE DESARROLLO INTEGRADO           {COLOR_RESET}")
    print(f"{COLOR_BOLD}======================================================================{COLOR_RESET}")
    print(f" {COLOR_CYAN}[BACKEND]{COLOR_RESET}   FastAPI : http://127.0.0.1:8000")
    print(f"             Swagger : http://127.0.0.1:8000/docs")
    print(f" {COLOR_GREEN}[FRONTEND]{COLOR_RESET}  React   : http://localhost:5173")
    print(f"----------------------------------------------------------------------")
    print(f" {COLOR_YELLOW}Presiona Ctrl + C en cualquier momento para detener ambos servicios.{COLOR_RESET}")
    print(f"{COLOR_BOLD}======================================================================{COLOR_RESET}\n", flush=True)

    # Comandos para backend y frontend
    # En Windows, npm requiere extensión .cmd o invocarse mediante el shell
    is_windows = os.name == "nt"
    npm_cmd = "npm.cmd" if is_windows else "npm"
    uv_cmd = "uv"

    # Verificar existencia de directorios
    if not BACKEND_DIR.exists():
        print(f"Error: No se encontró la carpeta {BACKEND_DIR}", file=sys.stderr)
        sys.exit(1)
    if not FRONTEND_DIR.exists():
        print(f"Error: No se encontró la carpeta {FRONTEND_DIR}", file=sys.stderr)
        sys.exit(1)

    # 1. iniciar Backend
    backend_args = [uv_cmd, "run", "uvicorn", "app.main:app", "--reload", "--port", "8000"]
    backend_proc = subprocess.Popen(
        backend_args,
        cwd=str(BACKEND_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
    )

    # iniciar Frontend
    frontend_args = [npm_cmd, "run", "dev"]
    frontend_proc = subprocess.Popen(
        frontend_args,
        cwd=str(FRONTEND_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
    )

    # hilos para redirigir las salidas de forma asíncrona
    t_back = threading.Thread(
        target=pipe_output,
        args=(backend_proc, "[BACKEND] ", COLOR_CYAN),
        daemon=True,
    )
    t_front = threading.Thread(
        target=pipe_output,
        args=(frontend_proc, "[FRONTEND]", COLOR_GREEN),
        daemon=True,
    )

    t_back.start()
    t_front.start()

    try:
        # mensaje para esperar a que alguno termine o que el usuario presione el contro + c
        while backend_proc.poll() is None and frontend_proc.poll() is None:
            time.sleep(0.5)

    except KeyboardInterrupt:
        print(f"\n{COLOR_YELLOW}\nDeteniendo backend y frontend...{COLOR_RESET}", flush=True)

    finally:
        # finalizar
        if backend_proc.poll() is None:
            kill_proc_tree(backend_proc.pid)
        if frontend_proc.poll() is None:
            kill_proc_tree(frontend_proc.pid)

        time.sleep(0.5)
        print(f"{COLOR_BOLD}Ambos servidores fueron detenidos correctamente.{COLOR_RESET}")


if __name__ == "__main__":
    main()
