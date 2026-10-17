"""
Deploy the Azure Function App.

    npm run deploy:api

Needed only when api/ changes — most often because content changed and
presenter.json was regenerated with it. CI tells you when that has happened; it
cannot do this step itself, and deliberately so: SCM basic publishing is
disabled on the Function App, and turning it on to obtain a publish profile
would weaken the deployment surface to automate something that runs a few times
a year. This uses whoever is already signed in to `az`.

The packing is the part that matters. Compress-Archive on Windows PowerShell
writes entry names with backslash separators; the Functions host runs Linux and
reads those as filenames rather than paths, so node_modules never resolves and
not one function registers — the whole app answers 404, including the ones that
were working. zipfile always writes forward slashes, and the assertion below
means a regression cannot ship quietly.
"""

import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = os.path.join(ROOT, "api")
ZIP = os.path.join(ROOT, ".api-deploy.zip")

APP = "evan-voice-api"
GROUP = "personal-website-rg"
BASE = f"https://{APP}.azurewebsites.net/api"
ORIGIN = "https://evanhuangportfolio.z44.web.core.windows.net"

SKIP_DIRS = {".git", "test", "__pycache__", "node_modules/.bin"}
SKIP_FILES = {"local.settings.json", "package-lock.json", ".funcignore"}


def run(*args, **kwargs):
    """az is a .cmd on Windows, so it needs the shell resolver."""
    return subprocess.run(args, shell=(os.name == "nt"), **kwargs)


def pack() -> int:
    if os.path.exists(ZIP):
        os.remove(ZIP)

    count = 0
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for root, dirs, files in os.walk(API):
            rel = os.path.relpath(root, API)
            if set(rel.split(os.sep)) & SKIP_DIRS:
                dirs[:] = []
                continue
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            for f in files:
                if f in SKIP_FILES or f.endswith(".md"):
                    continue
                full = os.path.join(root, f)
                z.write(full, os.path.relpath(full, API).replace(os.sep, "/"))
                count += 1

    with zipfile.ZipFile(ZIP) as z:
        names = z.namelist()
        assert not any("\\" in n for n in names), "backslash paths would brick the app"
        for required in ("host.json", "package.json", "presenter.json"):
            assert required in names, f"{required} missing from the package"
        assert any(n.startswith("node_modules/@azure/functions/") for n in names), \
            "dependencies missing — run `npm ci` in api/"
        functions = sorted(n.split("/")[-1] for n in names if n.startswith("src/functions/"))
        print(f"  {count} files, {os.path.getsize(ZIP) / 1048576:.1f} MB")
        print(f"  functions: {', '.join(functions)}")
    return count


def presenter_is_current() -> bool:
    """The catalogue is generated from the built site, not from source."""
    packaged = os.path.join(API, "presenter.json")
    if not os.path.exists(packaged):
        return False
    proc = run("git", "diff", "--quiet", "--", "api/presenter.json", cwd=ROOT)
    return proc.returncode == 0


def probe(path: str, method: str = "GET", origin: str | None = None,
          body: str | None = None, content_type: str = "application/json") -> int:
    headers = {}
    if origin:
        headers["Origin"] = origin
    if body is not None:
        headers["content-type"] = content_type
    req = urllib.request.Request(
        BASE + path,
        headers=headers,
        method=method,
        data=body.encode() if body is not None else None,
    )
    try:
        with urllib.request.urlopen(req, timeout=40) as res:
            return res.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


def main() -> int:
    if not os.path.isdir(os.path.join(API, "node_modules")):
        print("api/node_modules is missing. Run:  cd api && npm ci")
        return 1

    if not presenter_is_current():
        print("⚠ api/presenter.json differs from the last commit.")
        print("  If content changed, that is expected — regenerate and commit it first:")
        print("    npm run build && node scripts/gen-presenter.mjs")
        print("  Deploying now would ship a catalogue that is not in the repository.")
        if "--force" not in sys.argv:
            return 1
        print("  --force given, continuing anyway.\n")

    print("packing")
    pack()

    print("deploying")
    proc = run(
        "az", "functionapp", "deployment", "source", "config-zip",
        "--name", APP, "--resource-group", GROUP, "--src", ZIP, "-o", "none",
    )
    if proc.returncode != 0:
        print("deployment failed")
        return proc.returncode

    print("waiting for the host to pick it up")
    # Every probe below has to reach a handler and be rejected by it. A method
    # the route does not accept answers 404 here, exactly like a route that
    # does not exist — so "did it 404" cannot tell a healthy app from a bricked
    # one, and an earlier version of this reported a perfectly good deployment
    # as broken. Only a refusal that the code itself produced proves anything.
    def screened():
        return probe("/notes", "POST", origin="https://not-allowed.example", body="{}") == 403

    deadline = time.time() + 180
    while time.time() < deadline and not screened():
        time.sleep(5)

    print("smoke test")
    checks = [
        ("POST /notes  foreign origin refused",
         probe("/notes", "POST", origin="https://not-allowed.example", body="{}"), (403,)),
        ("POST /notes  empty note refused",
         probe("/notes", "POST", origin=ORIGIN, body='{"text":""}'), (400,)),
        ("POST /voice  bad SDP reaches the broker",
         probe("/voice", "POST", origin=ORIGIN, body="v=0", content_type="application/sdp"),
         (400, 502, 503)),
        ("POST /ask    empty question refused",
         probe("/ask", "POST", origin=ORIGIN, body="{}"), (400, 503)),
        ("GET  /notes  no key stays hidden", probe("/notes"), (404,)),
    ]
    ok = True
    for label, got, want in checks:
        fine = got in want
        ok = ok and fine
        print(f"  {'ok ' if fine else 'XX '}{label}: {got}"
              + ("" if fine else f"  (expected {' or '.join(map(str, want))})"))

    os.remove(ZIP)
    if not ok:
        print("\nSomething is not answering. Check the portal logs before assuming it is fine.")
        return 1

    print("\ndeployed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
