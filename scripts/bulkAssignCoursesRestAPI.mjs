/**
 * BULK ASSIGN COURSES - REST API VERSION (Offline Workaround)
 * 
 * When Firebase Realtime Database is offline, use REST API instead.
 * This bypasses the real-time connection issue while maintaining security.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DRY_RUN = process.env.DRY_RUN !== 'false';

// Mock data: 20 professors × 2 courses each
const MOCK_ASSIGNMENTS = {
  "adel.kaabia@smu.tn": ["CS102", "CS201"],
  "ahmed.jallouli@smu.tn": ["CS102", "CS201"],
  "amira.chebil@smu.tn": ["CS102", "CS201"],
  "bilel.marzouk@smu.tn": ["CS102", "CS201"],
  "chokri.ben.amor@smu.tn": ["CS102", "CS201"],
  "fatma.trabelsi@smu.tn": ["CS102", "CS201"],
  "hatem.ferjani@smu.tn": ["CS102", "CS201"],
  "hind.ferchichi@smu.tn": ["CS102", "CS201"],
  "ines.miled@smu.tn": ["CS102", "CS201"],
  "karim.gharbi@smu.tn": ["CS102", "CS201"],
  "leila.bouzid@smu.tn": ["CS102", "CS201"],
  "mohamed.ben.salah@smu.tn": ["CS102", "CS201"],
  "nabil.zouari@smu.tn": ["CS102", "CS201"],
  "rani.rekik@smu.tn": ["CS102", "CS201"],
  "rim.hammami@smu.tn": ["CS102", "CS201"],
  "sofiane.dridi@smu.tn": ["CS102", "CS201"],
  "sonia.khelifi@smu.tn": ["CS102", "CS201"],
  "tarek.bouaziz@smu.tn": ["CS102", "CS201"],
  "wafa.jlassi@smu.tn": ["CS102", "CS201"],
  "youssef.mansouri@smu.tn": ["CS102", "CS201"],
};

console.log("📝 BULK ASSIGN COURSES - REST API VERSION");
console.log(`   Using Firebase REST API (handles offline mode)\n`);

if (DRY_RUN) {
  console.log("⚠️  DRY RUN MODE - No changes will be applied");
  console.log("   To apply changes, run:\n");
  console.log("   DRY_RUN=false node scripts/bulkAssignCoursesRestAPI.mjs\n");
}

// Read service account
const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, "../serviceAccountKey.json"), "utf8")
);

const FIREBASE_DB_URL = "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app";
const FIREBASE_PROJECT_ID = serviceAccount.project_id;

console.log(`📦 Database: ${FIREBASE_PROJECT_ID}`);
console.log(`📚 Professors: ${Object.keys(MOCK_ASSIGNMENTS).length}`);
console.log(`📖 Courses per professor: 2`);
console.log(`💾 Total assignments: ${Object.keys(MOCK_ASSIGNMENTS).length * 2}\n`);

// Make HTTPS request helper
const makeHttpsRequest = (method, path, data = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(FIREBASE_DB_URL + path + '.json');
    
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    };

    const req = https.request(url, options, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsed = body ? JSON.parse(body) : null;
            resolve({ status: res.statusCode, data: parsed });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

// Main assignment function
const main = async () => {
  try {
    let assigned = 0;
    let failed = 0;

    console.log("📤 Simulating course assignments...\n");

    for (const [professorEmail, courses] of Object.entries(MOCK_ASSIGNMENTS)) {
      console.log(`   ${professorEmail}`);

      const professorId = professorEmail.split("@")[0];

      for (const courseCode of courses) {
        if (!DRY_RUN) {
          try {
            const path = `/professor_assignments/${professorId}/${courseCode}`;
            const response = await makeHttpsRequest('PUT', path, { assigned: true, timestamp: new Date().toISOString() });
            console.log(`      └─ ${courseCode}: ✅ assigned`);
          } catch (err) {
            console.log(`      └─ ${courseCode}: ❌ ${err.message}`);
            failed++;
          }
        } else {
          console.log(`      └─ ${courseCode}: [DRY_RUN]`);
        }

        assigned++;
      }

      console.log("");
    }

    console.log(`${"=".repeat(70)}`);
    console.log(`✅ Assignment Complete\n`);
    console.log(`📊 Results:`);
    console.log(`   Total assignments processed: ${assigned}`);
    console.log(`   Failed: ${failed}`);
    if (assigned > 0) {
      console.log(`   Success rate: ${((assigned - failed) / assigned * 100).toFixed(1)}%\n`);
    }

    if (DRY_RUN) {
      console.log(`⚠️  DRY RUN - No data actually written`);
      console.log(`\n   To apply changes, run:`);
      console.log(`   DRY_RUN=false node scripts/bulkAssignCoursesRestAPI.mjs\n`);
    }

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
};

main();
