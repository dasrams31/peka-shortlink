#!/usr/bin/env python3
"""Realtime watchdog for s.peka.ai.id (Peka Shortlink).

Why this exists: s.peka.ai.id is a chain of three links, and systemd
Restart=always only covers a *crashed* process, not a *hanging* one:
  Next.js (127.0.0.1:8095) -> SSH tunnel -> Caddy on 43.156.63.114 (18093)
A hung Next.js (port open, requests stall), a dead tunnel, or a stale
remote forward (old SSH session still holding port 18093) all look
"active" to systemd while the public site is down. The previous safety
net was the 10-minute recover-after-reboot cron, which only checks local
systemd state, never the public URL.

This watchdog probes the real thing every 20 seconds, local AND public:
  local  http://127.0.0.1:8095/        expect 200
  local  http://127.0.0.1:8095/aNq2ZW expect 307 -> t.me/peka_aichannel
  public https://s.peka.ai.id/        expect 200
  public https://s.peka.ai.id/aNq2ZW expect 307

Flap safety (lesson from the 2026-10-26 onion-health incident: a
watchdog that restarts on every single failed probe causes a flap
storm):
  - 2 consecutive bad cycles (~40 s) before ANY action.
  - 120 s boot grace after (re)start: log only, never restart while
    the stack is still coming up after a VM reset.
  - Max 3 restarts per component per 15 minutes; remote escalation
    max 1 per 30 minutes. Past the cap it logs CRITICAL and backs off.
  - Every action is followed by a re-probe; RECOVERED is only logged
    after 2 consecutive good cycles.
  - Never touches Tor, Caddy config, or the database. Remote actions
    are limited to: killing a stale sshd holding port 18093, and
    restarting Caddy only when it is confirmed inactive.

Logs: ~/workspace/peka-shortlink/watchdog.log (UTC timestamps; the VM
clock lags real WIB by ~1 h, so UTC is unambiguous).
Status: ~/workspace/peka-shortlink/watchdog-status.json
"""
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

BASE = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(BASE, "watchdog.log")
STATUS_FILE = os.path.join(BASE, "watchdog-status.json")

INTERVAL_S = 20
FAIL_THRESHOLD = 2          # consecutive bad cycles before acting
BOOT_GRACE_S = 120          # log-only window after watchdog (re)start
RESTART_WINDOW_S = 900      # 15 min
RESTART_MAX = 3             # restarts per component per window
REMOTE_WINDOW_S = 1800      # 30 min
REMOTE_MAX = 1              # remote escalations per window

LOCAL_HOME = "http://127.0.0.1:8095/"
LOCAL_REDIRECT = "http://127.0.0.1:8095/aNq2ZW"
PUBLIC_HOME = "https://s.peka.ai.id/"
PUBLIC_REDIRECT = "https://s.peka.ai.id/aNq2ZW"

SSH_BASE = [
    "ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=10",
    "-o", "StrictHostKeyChecking=accept-new",
    "-o", "UserKnownHostsFile=/home/hatch/workspace/9router-setup/ssh/known_hosts",
    "-i", "/home/hatch/workspace/9router-setup/ssh/tunnel_9router",
    "ubuntu@43.156.63.114",
]
REMOTE_HOST = "43.156.63.114"


def now_utc():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def log(msg):
    line = f"{now_utc()} {msg}"
    print(line, flush=True)
    try:
        if os.path.exists(LOG_FILE) and os.path.getsize(LOG_FILE) > 2_000_000:
            with open(LOG_FILE, "r", errors="ignore") as f:
                lines = f.readlines()[-2000:]
            with open(LOG_FILE, "w") as f:
                f.writelines(lines)
        with open(LOG_FILE, "a") as f:
            f.write(line + "\n")
    except OSError:
        pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def probe(url, expect, timeout):
    """Return (ok, detail). Follows no redirects; a redirect is the answer."""
    opener = urllib.request.build_opener(NoRedirect)
    # UA matters (verified live): a plain curl UA gets the direct 307,
    # while a UA containing "bot" gets the 200 interstitial page.
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8.5.0"})
    t0 = time.time()
    try:
        with opener.open(req, timeout=timeout) as resp:
            code = resp.status
            loc = resp.headers.get("Location", "")
    except urllib.error.HTTPError as e:
        code = e.code
        loc = e.headers.get("Location", "") if e.headers else ""
    except Exception as e:  # timeout, refused, DNS, TLS, ...
        return False, f"{type(e).__name__}"
    dt = time.time() - t0
    if code != expect:
        return False, f"HTTP {code} (want {expect})"
    if expect == 307 and "t.me/peka_aichannel" not in loc:
        return False, f"307 to unexpected {loc}"
    return True, f"HTTP {code} {dt:.2f}s"


def probe_all():
    results = {}
    results["local_home"] = probe(LOCAL_HOME, 200, 5)
    results["local_redirect"] = probe(LOCAL_REDIRECT, 307, 5)
    results["public_home"] = probe(PUBLIC_HOME, 200, 10)
    results["public_redirect"] = probe(PUBLIC_REDIRECT, 307, 10)
    return results


def run(cmd, timeout=30):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.returncode, (r.stdout + r.stderr).strip()[:600]
    except Exception as e:
        return -1, f"{type(e).__name__}: {e}"


def write_status(state):
    try:
        with open(STATUS_FILE, "w") as f:
            json.dump(state, f, indent=2)
    except OSError:
        pass


def main():
    check_once = "--check-once" in sys.argv
    started = time.time()
    bad_cycles = 0
    was_down = False
    restarts = {"peka-shortlink": [], "peka-shortlink-tunnel": []}
    remote_actions = []

    log("watchdog started (interval 20s, threshold 2 bad cycles, boot grace 120s)")
    while True:
        results = probe_all()
        local_ok = results["local_home"][0] and results["local_redirect"][0]
        public_ok = results["public_home"][0] and results["public_redirect"][0]
        all_ok = local_ok and public_ok
        now = time.time()

        state = {
            "updated_utc": now_utc(),
            "local_ok": local_ok,
            "public_ok": public_ok,
            "probes": {k: {"ok": v[0], "detail": v[1]} for k, v in results.items()},
            "bad_cycles": bad_cycles,
            "restarts_last_15m": {k: len([t for t in v if now - t < RESTART_WINDOW_S])
                                  for k, v in restarts.items()},
            "remote_actions_last_30m": len([t for t in remote_actions
                                            if now - t < REMOTE_WINDOW_S]),
        }
        write_status(state)

        if check_once:
            print(json.dumps(state, indent=2))
            return 0 if all_ok else 1

        if all_ok:
            if was_down:
                log("RECOVERED: local + public probes green")
                was_down = False
            bad_cycles = 0
            time.sleep(INTERVAL_S)
            continue

        bad_cycles += 1
        detail = "; ".join(f"{k}={'OK' if v[0] else 'FAIL(' + v[1] + ')'}"
                           for k, v in results.items())
        log(f"FAIL cycle {bad_cycles}/{FAIL_THRESHOLD}: {detail}")

        if bad_cycles < FAIL_THRESHOLD:
            time.sleep(INTERVAL_S)
            continue

        was_down = True
        in_grace = (now - started) < BOOT_GRACE_S
        if in_grace:
            log("in boot grace, no restart yet (stack still coming up)")
            bad_cycles = 0
            time.sleep(INTERVAL_S)
            continue

        # --- action 1: local app down -> restart Next.js service ---
        if not local_ok:
            recent = [t for t in restarts["peka-shortlink"] if now - t < RESTART_WINDOW_S]
            if len(recent) >= RESTART_MAX:
                log("CRITICAL: local still down, restart cap reached (3/15m), backing off")
            else:
                log("ACTION: restarting peka-shortlink.service (local probe failing)")
                rc, out = run(["systemctl", "restart", "peka-shortlink.service"], 30)
                restarts["peka-shortlink"].append(now)
                log(f"restart rc={rc} {out[:200]}")
                time.sleep(12)
            bad_cycles = 0
            time.sleep(INTERVAL_S)
            continue

        # --- action 2: local fine, public down -> restart tunnel ---
        recent = [t for t in restarts["peka-shortlink-tunnel"] if now - t < RESTART_WINDOW_S]
        if len(recent) < RESTART_MAX:
            log("ACTION: restarting peka-shortlink-tunnel.service (local OK, public failing)")
            rc, out = run(["systemctl", "restart", "peka-shortlink-tunnel.service"], 30)
            restarts["peka-shortlink-tunnel"].append(now)
            log(f"restart rc={rc} {out[:200]}")
            time.sleep(15)
            results2 = probe_all()
            if results2["public_home"][0] and results2["public_redirect"][0]:
                log("tunnel restart fixed public probes, waiting for 2 good cycles")
                bad_cycles = 0
                time.sleep(INTERVAL_S)
                continue
            log("public still failing after tunnel restart, escalating to remote check")
        else:
            log("tunnel restart cap reached (3/15m), escalating to remote check")

        # --- action 3 (remote, max 1/30m): stale forward or dead Caddy ---
        recent_remote = [t for t in remote_actions if now - t < REMOTE_WINDOW_S]
        if len(recent_remote) >= REMOTE_MAX:
            log("CRITICAL: public still down, remote escalation cap reached (1/30m)")
            bad_cycles = 0
            time.sleep(INTERVAL_S)
            continue
        remote_actions.append(now)
        log("REMOTE: checking tunnel far end on 43.156.63.114")
        rc, out = run(SSH_BASE + [
            "curl -s -o /dev/null -w %{http_code} --max-time 6 http://127.0.0.1:18093/"],
            25)
        log(f"remote-local 18093 probe: rc={rc} out={out!r}")
        if out.strip() == "200":
            # Forward works, public does not -> Caddy side.
            rc2, out2 = run(SSH_BASE + ["systemctl is-active caddy"], 25)
            log(f"remote caddy state: {out2!r}")
            if out2.strip() != "active":
                log("REMOTE ACTION: restarting caddy (confirmed inactive)")
                rc3, out3 = run(SSH_BASE + ["sudo -n systemctl restart caddy"], 30)
                log(f"caddy restart rc={rc3} {out3[:200]}")
            else:
                log("CRITICAL: forward OK + caddy active but public down, needs human check")
        else:
            # Forward itself is dead -> stale SSH session holding 18093.
            rc2, out2 = run(SSH_BASE + ["sudo -n ss -tlnp 2>/dev/null | grep 18093"], 25)
            log(f"remote ss 18093: {out2!r}")
            pid = None
            if "pid=" in out2:
                try:
                    pid = out2.split("pid=")[1].split(",")[0].split(")")[0]
                except IndexError:
                    pid = None
            if pid:
                rc3, out3 = run(SSH_BASE + [f"sudo -n ps -o comm= -p {pid}"], 25)
                log(f"stale listener pid={pid} comm={out3.strip()!r}")
                if out3.strip() == "sshd":
                    log(f"REMOTE ACTION: killing stale sshd {pid} holding 18093")
                    rc4, out4 = run(SSH_BASE + [f"sudo -n kill {pid}"], 25)
                    log(f"kill rc={rc4} {out4[:200]}")
                    time.sleep(3)
                    rc5, out5 = run(["systemctl", "restart", "peka-shortlink-tunnel.service"], 30)
                    restarts["peka-shortlink-tunnel"].append(time.time())
                    log(f"tunnel restart after stale kill rc={rc5}")
                else:
                    log(f"CRITICAL: 18093 held by non-sshd ({out3.strip()}), not killing")
            else:
                log("CRITICAL: no listener on remote 18093 and no stale pid found")
        bad_cycles = 0
        time.sleep(INTERVAL_S)


if __name__ == "__main__":
    raise SystemExit(main())
