// scripts/createProfessors.mjs
// Run once: node scripts/createProfessors.mjs

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { readFileSync } from "fs";

// Download your service account key from:
// Firebase Console → Project Settings → Service Accounts → Generate new private key
const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://smart-class-6f3a8-default-rtdb.europe-west1.firebasedatabase.app/"
});

const adminAuth = getAuth();
const db        = getDatabase();

const professors = [
  // ─── ISS Department ───────────────────────────────────────────
  {
    email:        "a.a.jallouli@smu.tn",
    password:     "SMU@Jallouli2025",
    name:         "Dr. Ahmed Jallouli",
    department:   "ISS",
    phone:        "+216 71 000 011",
    moodleUserId: 13,
    assignedRooms: { B204: true, A101: true }
  },
  {
    email:        "f.trabelsi@smu.tn",
    password:     "SMU@Trabelsi2025",
    name:         "Dr. Fatma Trabelsi",
    department:   "ISS",
    phone:        "+216 71 000 012",
    moodleUserId: 14,
    assignedRooms: { C310: true, D105: true }
  },
  {
    email:        "h.ferchichi@smu.tn",
    password:     "SMU@Ferchichi2025",
    name:         "Dr. Hind Ferchichi",
    department:   "ISS",
    phone:        "+216 71 000 013",
    moodleUserId: 15,
    assignedRooms: { B204: true, C310: true }
  },

  // ─── Computer Science ─────────────────────────────────────────
  {
    email:        "m.bensalah@smu.tn",
    password:     "SMU@BenSalah2025",
    name:         "Dr. Mohamed Ben Salah",
    department:   "CS",
    phone:        "+216 71 000 014",
    moodleUserId: 16,
    assignedRooms: { A101: true, B204: true }
  },
  {
    email:        "r.rekik@smu.tn",
    password:     "SMU@Rekik2025",
    name:         "Dr. Rania Rekik",
    department:   "CS",
    phone:        "+216 71 000 015",
    moodleUserId: 17,
    assignedRooms: { D105: true, A101: true }
  },
  {
    email:        "t.bouaziz@smu.tn",
    password:     "SMU@Bouaziz2025",
    name:         "Dr. Tarek Bouaziz",
    department:   "CS",
    phone:        "+216 71 000 016",
    moodleUserId: 18,
    assignedRooms: { B204: true, D105: true }
  },

  // ─── Mathematics ─────────────────────────────────────────────
  {
    email:        "l.bouzid@smu.tn",
    password:     "SMU@Bouzid2025",
    name:         "Dr. Leila Bouzid",
    department:   "Mathematics",
    phone:        "+216 71 000 017",
    moodleUserId: 19,
    assignedRooms: { C310: true, A101: true }
  },
  {
    email:        "r.hammami@smu.tn",
    password:     "SMU@Hammami2025",
    name:         "Dr. Rim Hammami",
    department:   "Mathematics",
    phone:        "+216 71 000 018",
    moodleUserId: 20,
    assignedRooms: { A101: true, D105: true }
  },
  {
    email:        "c.benamor@smu.tn",
    password:     "SMU@BenAmor2025",
    name:         "Dr. Chokri Ben Amor",
    department:   "Mathematics",
    phone:        "+216 71 000 019",
    moodleUserId: 21,
    assignedRooms: { C310: true, B204: true }
  },

  // ─── Electrical & Computer Engineering ───────────────────────
  {
    email:        "k.gharbi@smu.tn",
    password:     "SMU@Gharbi2025",
    name:         "Dr. Karim Gharbi",
    department:   "ECE",
    phone:        "+216 71 000 020",
    moodleUserId: 22,
    assignedRooms: { D105: true, B204: true }
  },
  {
    email:        "b.marzouk@smu.tn",
    password:     "SMU@Marzouk2025",
    name:         "Dr. Bilel Marzouk",
    department:   "ECE",
    phone:        "+216 71 000 021",
    moodleUserId: 23,
    assignedRooms: { A101: true, C310: true }
  },
  {
    email:        "a.kaabia@smu.tn",
    password:     "SMU@Kaabia2025",
    name:         "Dr. Adel Kaabia",
    department:   "ECE",
    phone:        "+216 71 000 022",
    moodleUserId: 24,
    assignedRooms: { B204: true, A101: true }
  },

  // ─── Chemistry ───────────────────────────────────────────────
  {
    email:        "s.khelifi@smu.tn",
    password:     "SMU@Khelifi2025",
    name:         "Dr. Sonia Khelifi",
    department:   "Chemistry",
    phone:        "+216 71 000 023",
    moodleUserId: 25,
    assignedRooms: { C310: true, D105: true }
  },
  {
    email:        "i.miled@smu.tn",
    password:     "SMU@Miled2025",
    name:         "Dr. Ines Miled",
    department:   "Chemistry",
    phone:        "+216 71 000 024",
    moodleUserId: 26,
    assignedRooms: { D105: true, C310: true }
  },

  // ─── Economics ───────────────────────────────────────────────
  {
    email:        "y.mansouri@smu.tn",
    password:     "SMU@Mansouri2025",
    name:         "Dr. Youssef Mansouri",
    department:   "Economics",
    phone:        "+216 71 000 025",
    moodleUserId: 27,
    assignedRooms: { A101: true, C310: true }
  },
  {
    email:        "s.dridi@smu.tn",
    password:     "SMU@Dridi2025",
    name:         "Dr. Sofiane Dridi",
    department:   "Economics",
    phone:        "+216 71 000 026",
    moodleUserId: 28,
    assignedRooms: { B204: true, D105: true }
  },

  // ─── English & Languages ─────────────────────────────────────
  {
    email:        "a.chebil@smu.tn",
    password:     "SMU@Chebil2025",
    name:         "Dr. Amira Chebil",
    department:   "Languages",
    phone:        "+216 71 000 027",
    moodleUserId: 29,
    assignedRooms: { C310: true, A101: true }
  },
  {
    email:        "w.jlassi@smu.tn",
    password:     "SMU@Jlassi2025",
    name:         "Dr. Wafa Jlassi",
    department:   "Languages",
    phone:        "+216 71 000 028",
    moodleUserId: 30,
    assignedRooms: { D105: true, B204: true }
  },

  // ─── Physics ─────────────────────────────────────────────────
  {
    email:        "n.zouari@smu.tn",
    password:     "SMU@Zouari2025",
    name:         "Dr. Nabil Zouari",
    department:   "Physics",
    phone:        "+216 71 000 029",
    moodleUserId: 31,
    assignedRooms: { A101: true, D105: true }
  },
  {
    email:        "h.ferjani@smu.tn",
    password:     "SMU@Ferjani2025",
    name:         "Dr. Hatem Ferjani",
    department:   "Physics",
    phone:        "+216 71 000 030",
    moodleUserId: 32,
    assignedRooms: { C310: true, B204: true }
  },
];

for (const prof of professors) {
  try {
    // Create Firebase Auth account
    const userRecord = await adminAuth.createUser({
      email:         prof.email,
      password:      prof.password,
      displayName:   prof.name,
    });

    // Write to /professors/{uid}
    await db.ref(`/professors/${userRecord.uid}`).set({
      name:          prof.name,
      email:         prof.email,
      department:    prof.department,
      phone:         prof.phone,
      moodleUserId:  prof.moodleUserId,
      assignedRooms: prof.assignedRooms,
      accountStatus: "active",
      settings: {
        alertEmail: true,
        alertThresholds: {
          tempMax: 30,
          humidityMax: 70,
          co2Max: 1000,
          noiseMax: 75
        }
      }
    });

    console.log(`✅ Created: ${prof.email} → uid: ${userRecord.uid}`);
  } catch (err) {
    console.error(`❌ Failed for ${prof.email}:`, err.message);
  }
}

process.exit(0);
