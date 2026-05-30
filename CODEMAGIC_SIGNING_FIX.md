# Codemagic iOS Signing — Έτοιμο

Τα secrets ρυθμίστηκαν τοπικά. Το `codemagic.yaml` χρησιμοποιεί **μόνο environment variables** (όχι Team integration UI).

## Group στο Codemagic: `code-signing`

Πρόσθεσε **4 μεταβλητές** (όλες Secret=ON):

| Variable | Τιμή |
|----------|------|
| `APP_STORE_CONNECT_ISSUER_ID` | `48abdbcd-e5f5-477a-b7a5-d38d3871e536` |
| `APP_STORE_CONNECT_KEY_IDENTIFIER` | `73C3B2263N` |
| `APP_STORE_CONNECT_PRIVATE_KEY` | περιεχόμενο `secrets/AuthKey_73C3B2263N.p8` |
| `CERTIFICATE_PRIVATE_KEY` | περιεχόμενο `ios_distribution_private_key` |

### Αυτόματη αντιγραφή (clipboard)

```powershell
.\scripts\configure-codemagic-secrets.ps1
```

Πατάς Enter ανά μεταβλητή και κάνεις Ctrl+V στο Codemagic.

### Αυτόματο build (χωρίς UI paste)

Πρόσθεσε στο `.env`:
```
CODEMAGIC_API_TOKEN=το_token_σου
```

```powershell
python scripts/codemagic_trigger_build.py
```

---

## Push και rebuild

```powershell
git add codemagic.yaml CODEMAGIC_SIGNING_FIX.md scripts/ .gitignore
git commit -m "Codemagic signing via env vars (API key 73C3B2263N)"
git push origin main
```

Workflow: **`ios-production`**
