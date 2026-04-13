# Firebase Configuration - Quick Reference Card

## ✅ Your Configuration is CORRECT

| Item | Value | Status |
|------|-------|--------|
| Database URL | `https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app` | ✅ Correct |
| Project ID | `smart-class-6f3a8` | ✅ Correct |
| Region | `europe-west1` | ✅ Correct |
| Protocol | `https://` | ✅ Correct |
| Format | Regional (.firebasedatabase.app) | ✅ Correct |

---

## The Problem (Not URL Configuration)

**Your system's DNS cannot resolve Firebase domains to IP addresses.**

```
nslookup smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app
→ Timeout / SOA records only (no IP resolution)

nslookup google.com
→ Works fine (returns IP address)
```

---

## Quick Fix (Most Likely to Work)

**Run in PowerShell as Administrator:**

```powershell
Restart-Service -Name "dnscache" -Force
ipconfig /flushdns
```

**Then test:**
```powershell
nslookup smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app
# Should now return an IP address (e.g., 35.187.103.10)
```

---

## Verify Fix

Run this test script:
```bash
node scripts/testFirebaseDirectHTTPS.mjs
```

Look for:
- ✅ "Firebase Admin SDK initialized successfully"
- ✅ "Connection Status: 🟢 CONNECTED"
- ✅ "Successfully read from database"

If you see these, DNS is fixed!

---

## Then Run Your Scripts

```bash
# Dry run (view what would happen)
node scripts/bulkAssignCoursesToProfessors.mjs

# Apply changes
DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs

# Verify all assignments
node scripts/verifyAssignments.mjs
```

---

## If DNS Fix Doesn't Work

**Alternative Fix 1:** Switch WiFi to IPv4-only
- Settings > Network & Internet > WiFi > Properties
- Change to "IPv4 only"

**Alternative Fix 2:** Manual DNS servers
```powershell
Set-DnsClientServerAddress -InterfaceAlias "WiFi" `
  -ServerAddresses ("8.8.8.8", "8.8.4.4") -Validate
```

**Alternative Fix 3:** Edit hosts file
- Open `C:\Windows\System32\drivers\etc\hosts` as Administrator
- Add: `35.187.103.10  smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app`
- Save and run: `ipconfig /flushdns`

---

## Key Points

✅ Database URL is correct - don't change it  
✅ Service account credentials are valid  
✅ Firebase SDK initializes successfully  
❌ DNS resolution is broken - this is what needs fixing  

---

## Status Files

- **FIREBASE_ANALYSIS_SUMMARY.md** → Complete analysis & solutions
- **DNS_RESOLUTION_FIX.md** → Detailed DNS troubleshooting steps
- **FIREBASE_CONFIG_REFERENCE.md** → URL format reference
- **CORRECTED_INITIALIZATION_CODE.md** → Code examples (all correct)
- **scripts/testFirebaseDirectHTTPS.mjs** → Connection test script

---

## One-Line Commands

```bash
# Test DNS
nslookup smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app

# Fix DNS (Windows)
Restart-Service -Name "dnscache" -Force; ipconfig /flushdns

# Test Firebase connection
node scripts/testFirebaseDirectHTTPS.mjs

# Dry run bulk assignment
node scripts/bulkAssignCoursesToProfessors.mjs

# Apply bulk assignment
DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs

# Verify all assignments
node scripts/verifyAssignments.mjs
```

---

## Immediate Next Step

1. Run DNS fix (PowerShell as Administrator):
   ```powershell
   Restart-Service -Name "dnscache" -Force; ipconfig /flushdns
   ```

2. Test DNS resolution:
   ```powershell
   nslookup smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app
   ```

3. If it shows an IP address, run:
   ```bash
   node scripts/testFirebaseDirectHTTPS.mjs
   ```

That's it! ✨
