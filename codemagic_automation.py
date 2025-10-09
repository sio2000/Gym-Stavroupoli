#!/usr/bin/env python3
"""
Codemagic Build Automation Script
Αυτό το script αυτοματοποιεί το build process μέσω Codemagic API
"""

import requests
import json
import time
import sys
from pathlib import Path

class CodemagicAutomation:
    def __init__(self, api_token):
        self.api_token = api_token
        self.base_url = "https://api.codemagic.io"
        self.headers = {
            "x-auth-token": api_token,
            "Content-Type": "application/json"
        }
    
    def list_applications(self):
        """Λίστα όλων των applications"""
        print("📱 Ανάκτηση λίστας applications...")
        response = requests.get(
            f"{self.base_url}/apps",
            headers=self.headers
        )
        
        if response.status_code == 200:
            apps = response.json()
            print(f"✅ Βρέθηκαν {len(apps.get('applications', []))} applications")
            return apps.get('applications', [])
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            return []
    
    def get_app_id(self, app_name="getfitskg"):
        """Βρίσκει το app ID με βάση το όνομα"""
        apps = self.list_applications()
        for app in apps:
            if app_name.lower() in app.get('appName', '').lower():
                return app.get('_id')
        return None
    
    def list_workflows(self, app_id):
        """Λίστα workflows για ένα app"""
        print(f"\n⚙️ Ανάκτηση workflows για app {app_id}...")
        response = requests.get(
            f"{self.base_url}/apps/{app_id}",
            headers=self.headers
        )
        
        if response.status_code == 200:
            app_data = response.json()
            workflows = app_data.get('workflows', {})
            print(f"✅ Βρέθηκαν {len(workflows)} workflows:")
            for wf_id, wf_data in workflows.items():
                print(f"  - {wf_id}: {wf_data.get('name', 'Unnamed')}")
            return workflows
        else:
            print(f"❌ Error: {response.status_code}")
            return {}
    
    def start_build(self, app_id, workflow_id="ios-workflow", branch="main"):
        """Ξεκινάει ένα build"""
        print(f"\n🚀 Έναρξη build...")
        print(f"   App ID: {app_id}")
        print(f"   Workflow: {workflow_id}")
        print(f"   Branch: {branch}")
        
        payload = {
            "appId": app_id,
            "workflowId": workflow_id,
            "branch": branch
        }
        
        response = requests.post(
            f"{self.base_url}/builds",
            headers=self.headers,
            json=payload
        )
        
        if response.status_code == 201:
            build_data = response.json()
            build_id = build_data.get('buildId')
            print(f"✅ Build ξεκίνησε επιτυχώς!")
            print(f"   Build ID: {build_id}")
            return build_id
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            return None
    
    def get_build_status(self, app_id, build_id):
        """Ελέγχει το status ενός build"""
        response = requests.get(
            f"{self.base_url}/builds/{build_id}",
            headers=self.headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return None
    
    def monitor_build(self, app_id, build_id):
        """Παρακολουθεί ένα build μέχρι να ολοκληρωθεί"""
        print(f"\n⏳ Παρακολούθηση build {build_id}...")
        print("   (Αυτό μπορεί να πάρει 15-25 λεπτά)\n")
        
        start_time = time.time()
        last_status = None
        
        while True:
            build_data = self.get_build_status(app_id, build_id)
            
            if build_data:
                status = build_data.get('status')
                
                if status != last_status:
                    elapsed = int(time.time() - start_time)
                    print(f"   [{elapsed}s] Status: {status}")
                    last_status = status
                
                if status in ['finished', 'failed', 'canceled', 'timeout']:
                    print(f"\n🏁 Build ολοκληρώθηκε με status: {status}")
                    return build_data
            
            time.sleep(30)  # Check κάθε 30 δευτερόλεπτα
    
    def download_artifacts(self, build_data, output_dir="./builds"):
        """Κατεβάζει τα artifacts από ένα build"""
        artifacts = build_data.get('artefacts', [])
        
        if not artifacts:
            print("⚠️ Δεν βρέθηκαν artifacts")
            return
        
        Path(output_dir).mkdir(exist_ok=True)
        
        print(f"\n📥 Λήψη artifacts ({len(artifacts)} αρχεία)...")
        
        for artifact in artifacts:
            name = artifact.get('name')
            url = artifact.get('url')
            
            if url and name:
                print(f"   Downloading: {name}")
                
                response = requests.get(url, stream=True)
                if response.status_code == 200:
                    output_path = Path(output_dir) / name
                    with open(output_path, 'wb') as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            f.write(chunk)
                    print(f"   ✅ Saved to: {output_path}")
                else:
                    print(f"   ❌ Failed to download {name}")
    
    def full_build_process(self, workflow_id="ios-development", branch="main"):
        """Ολοκληρωμένη διαδικασία build"""
        print("=" * 60)
        print("🚀 CODEMAGIC BUILD AUTOMATION")
        print("=" * 60)
        
        # 1. Βρες το app
        app_id = self.get_app_id("getfitskg")
        if not app_id:
            print("❌ Δεν βρέθηκε το app 'getfitskg'")
            print("   Βεβαιώσου ότι έχεις συνδέσει το repository στο Codemagic")
            return
        
        print(f"✅ App ID: {app_id}")
        
        # 2. Λίστα workflows
        workflows = self.list_workflows(app_id)
        
        # 3. Ξεκίνα build
        build_id = self.start_build(app_id, workflow_id, branch)
        if not build_id:
            return
        
        print(f"\n🔗 Παρακολούθησε το build εδώ:")
        print(f"   https://codemagic.io/app/{app_id}/build/{build_id}")
        
        # 4. Παρακολούθηση
        build_data = self.monitor_build(app_id, build_id)
        
        # 5. Download artifacts
        if build_data.get('status') == 'finished':
            self.download_artifacts(build_data)
            print("\n" + "=" * 60)
            print("✅ ΟΛΟΚΛΗΡΩΘΗΚΕ ΕΠΙΤΥΧΩΣ!")
            print("=" * 60)
            print(f"\n📦 Το .ipa αρχείο βρίσκεται στο φάκελο: ./builds/")
        else:
            print("\n" + "=" * 60)
            print("❌ BUILD FAILED")
            print("=" * 60)
            print("\nΔες τα logs στο Codemagic dashboard για περισσότερες λεπτομέρειες")


def main():
    print("\n" + "=" * 60)
    print("🔧 CODEMAGIC AUTOMATION SETUP")
    print("=" * 60)
    print("\nΓια να χρησιμοποιήσεις αυτό το script:")
    print("\n1. Πήγαινε στο Codemagic: https://codemagic.io/")
    print("2. Login → User Settings → Integrations")
    print("3. Δημιούργησε ένα API token")
    print("4. Τρέξε το script με το token:\n")
    print("   python codemagic_automation.py <API_TOKEN>\n")
    print("Παράδειγμα:")
    print("   python codemagic_automation.py abc123xyz456...\n")
    print("=" * 60)
    
    if len(sys.argv) < 2:
        print("\n⚠️ Δεν δόθηκε API token!")
        print("\nΧρήση:")
        print("   python codemagic_automation.py <API_TOKEN> [workflow] [branch]")
        print("\nWorkflows:")
        print("   - ios-development (default, δωρεάν, χωρίς code signing)")
        print("   - ios-workflow (production, με code signing)")
        print("\nBranch:")
        print("   - main (default)")
        sys.exit(1)
    
    api_token = sys.argv[1]
    workflow = sys.argv[2] if len(sys.argv) > 2 else "ios-development"
    branch = sys.argv[3] if len(sys.argv) > 3 else "main"
    
    automation = CodemagicAutomation(api_token)
    automation.full_build_process(workflow, branch)


if __name__ == "__main__":
    main()

