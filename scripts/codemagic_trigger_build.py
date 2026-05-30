#!/usr/bin/env python3
"""Trigger Codemagic build with signing secrets (no UI paste)."""
import json
import os
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
ISSUER_ID = "48abdbcd-e5f5-477a-b7a5-d38d3871e536"
KEY_ID = "73C3B2263N"


def load_secrets():
    p8 = (ROOT / "secrets" / f"AuthKey_{KEY_ID}.p8").read_text(encoding="utf-8").strip()
    cert = (ROOT / "ios_distribution_private_key").read_text(encoding="utf-8").strip()
    return {
        "APP_STORE_CONNECT_ISSUER_ID": ISSUER_ID,
        "APP_STORE_CONNECT_KEY_IDENTIFIER": KEY_ID,
        "APP_STORE_CONNECT_PRIVATE_KEY": p8,
        "CERTIFICATE_PRIVATE_KEY": cert,
    }


def find_app_id(token: str) -> str:
    r = requests.get(
        "https://api.codemagic.io/apps",
        headers={"x-auth-token": token, "Content-Type": "application/json"},
        timeout=30,
    )
    r.raise_for_status()
    for app in r.json().get("applications", []):
        repo = (app.get("repository") or {}).get("url", "").lower()
        name = (app.get("appName") or "").lower()
        if "gym-stavroupoli" in repo or "gym" in name or "getfit" in name:
            return app["_id"]
    raise SystemExit("App not found on Codemagic. Connect the GitHub repo first.")


def main():
    token = os.environ.get("CODEMAGIC_API_TOKEN")
    env_file = ROOT / ".env"
    if not token and env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.strip().startswith("CODEMAGIC_API_TOKEN="):
                token = line.split("=", 1)[1].strip().strip('"').strip("'")
    if not token and len(sys.argv) > 1:
        token = sys.argv[1]
    if not token:
        print("Set CODEMAGIC_API_TOKEN in .env or pass as argument.")
        sys.exit(1)

    workflow = sys.argv[2] if len(sys.argv) > 2 else "ios-production"
    branch = sys.argv[3] if len(sys.argv) > 3 else "main"

    app_id = find_app_id(token)
    body = {
        "appId": app_id,
        "workflowId": workflow,
        "branch": branch,
        "environment": {"variables": load_secrets()},
    }
    r = requests.post(
        "https://api.codemagic.io/builds",
        headers={"x-auth-token": token, "Content-Type": "application/json"},
        json=body,
        timeout=30,
    )
    if r.status_code != 201:
        print(f"Failed {r.status_code}: {r.text}")
        sys.exit(1)
    build_id = r.json().get("buildId")
    print(f"Build started: {build_id}")
    print(f"https://codemagic.io/app/{app_id}/build/{build_id}")


if __name__ == "__main__":
    main()
