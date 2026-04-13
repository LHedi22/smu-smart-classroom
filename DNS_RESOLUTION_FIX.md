# DNS Resolution Fix Guide

Your Firebase configuration URLs are **correct**. The problem is your system cannot resolve Firebase domain names to IP addresses.

---

## Quick Diagnosis

Run this PowerShell command:

```powershell
# Test DNS resolution
nslookup smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app
```

**Expected Result:**
```
Name:    smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app
Address: 35.187.103.10 (or similar)
```

**Actual Result (Your System):**
```
Non-authoritative answer:
SOA: ...timeout...
```

This means DNS is broken at the system level.

---

## Fix 1: Restart DNS Service (Windows) ⚡ QUICKEST

Run PowerShell **as Administrator**:

```powershell
# Stop and restart DNS caching service
Restart-Service -Name "dnscache" -Force

# Flush DNS cache
ipconfig /flushdns

# Verify DNS is working
nslookup smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app

# Test Node.js connection
node scripts/testFirebaseDirectHTTPS.mjs
```

---

## Fix 2: Switch WiFi to IPv4-Only

Your system is preferring broken IPv6 DNS gateway:

1. Open **Settings**
2. Go to **Network & Internet**
3. Click **WiFi** > **Properties**
4. Scroll to **IP settings**
5. Change from **"Automatic (IPv4/IPv6)"** to **"IPv4 only"**
6. Click **Save**
7. Wait 10 seconds
8. Test:
   ```powershell
   nslookup smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app
   ```

---

## Fix 3: Manually Set DNS Servers

Run PowerShell **as Administrator**:

```powershell
# Get current network adapter
Get-NetAdapter -Physical | Select Name

# Set DNS to Google (replace "WiFi" with your adapter name)
Set-DnsClientServerAddress -InterfaceAlias "WiFi" -ServerAddresses ("8.8.8.8", "8.8.4.4") -Validate

# Or use Cloudflare
Set-DnsClientServerAddress -InterfaceAlias "WiFi" -ServerAddresses ("1.1.1.1", "1.0.0.1") -Validate

# Verify
nslookup smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app
```

---

## Fix 4: Edit Hosts File (Workaround)

If other solutions don't work, manually map the Firebase IP:

1. Run **Notepad as Administrator**
2. Open: `C:\Windows\System32\drivers\etc\hosts`
3. Add this line at the bottom:
   ```
   35.187.103.10  smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app
   ```
4. Save and close
5. Flush DNS cache:
   ```powershell
   ipconfig /flushdns
   ```

---

## Fix 5: Check Windows Firewall

1. Open **Settings**
2. Go to **Privacy & Security**
3. Click **Windows Defender Firewall**
4. Click **Allow an app through firewall**
5. Find **Node.js** in the list
6. Ensure it's checked for both "Private" and "Public"
7. Click **OK**

---

## Fix 6: Full Network Reset (Nuclear Option)

If nothing works, reset your network:

```powershell
# Run as Administrator
ipconfig /release
ipconfig /renew
ipconfig /flushdns

# Restart your computer
Restart-Computer
```

---

## Test Script

After applying a fix, run this to verify Firebase connection:

```bash
node scripts/testFirebaseDirectHTTPS.mjs
```

If you see:
- ✅ "Firebase Admin SDK initialized successfully"
- ✅ "Connection Status: 🟢 CONNECTED"
- ✅ "Successfully read from database"

Then your DNS is fixed and you can run:

```bash
DRY_RUN=false node scripts/bulkAssignCoursesToProfessors.mjs
```

---

## What NOT to Do

❌ Don't change the Firebase database URL (it's correct)  
❌ Don't use generic region URL like `europe-west1.firebasedatabase.app`  
❌ Don't switch protocols from HTTPS to HTTP  

Your configuration is correct. Only DNS needs fixing.

---

## If Still Not Working

Contact network admin or ISP. The issue might be:
1. **ISP blocking Firebase domains** (check ISP support)
2. **Router DNS gateway broken** (restart router)
3. **Antivirus blocking DNS port 53** (check antivirus settings)
4. **Network adapter driver outdated** (update drivers)

Try on a different network (mobile hotspot) to isolate the issue:

```bash
# Switch to mobile hotspot and run test
node scripts/testFirebaseDirectHTTPS.mjs
```

If it works on mobile hotspot, the issue is your WiFi network, not your code.
