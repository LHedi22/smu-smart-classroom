// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, get, update } from "firebase/database";
import { auth, db } from "../firebase";
import { getProfessorCourses } from "../services/moodleApi";

// Background sync: merge rooms from the Flask Schedule into profile.assignedRooms.
// Fire-and-forget so it never blocks login. Manual admin-added rooms survive
// (union, not replace). The write only happens if something changed so we don't
// cause unnecessary profile re-renders on every login.
async function syncAssignedRoomsFromSchedule(uid, profile) {
  const moodleUserId = profile?.moodleUserId;
  if (moodleUserId == null) return;
  try {
    const courses = await getProfessorCourses(moodleUserId);
    const derived = {};
    for (const c of courses ?? []) {
      for (const s of c.schedule ?? []) {
        if (s.room) derived[s.room] = true;
      }
    }
    const current = profile.assignedRooms ?? {};
    const merged = { ...current, ...derived };
    const changed = Object.keys(merged).some(k => current[k] !== merged[k]);
    if (changed) {
      await update(ref(db, `/professors/${uid}`), { assignedRooms: merged });
    }
  } catch (err) {
    console.warn("[AuthContext] Room sync skipped:", err?.message);
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);  // Firebase Auth user
  const [profile, setProfile]     = useState(null);  // /professors/{uid} data
  const [isAdmin, setIsAdmin]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const hasResolvedInitialAuth = useRef(false);

  const getWithTimeout = (path, timeoutMs = 8000) =>
    new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout reading ${path}`));
      }, timeoutMs);

      get(ref(db, path))
        .then((snap) => {
          clearTimeout(timeoutId);
          resolve(snap);
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          reject(err);
        });
    });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!hasResolvedInitialAuth.current) {
        setLoading(true);
      }
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        hasResolvedInitialAuth.current = true;
        setLoading(false);
        return;
      }

      try {
        // Check if admin (permission denied = not an admin, continue)
        try {
          const adminSnap = await getWithTimeout(`/admins/${firebaseUser.uid}`);
          if (adminSnap.exists()) {
            console.log('✅ Admin detected:', firebaseUser.uid);
            setUser(firebaseUser);
            setIsAdmin(true);
            setProfile(null);
            return;
          }
        } catch (err) {
          console.log('⚠️ Admin check failed (expected if not admin):', err.message);
        }

        // Check if professor
        try {
          const profSnap = await getWithTimeout(`/professors/${firebaseUser.uid}`);
          if (profSnap.exists()) {
            console.log('✅ Professor detected:', firebaseUser.uid);
            const profileData = profSnap.val();
            setUser(firebaseUser);
            setProfile(profileData);
            setIsAdmin(false);
            // Background: keep assignedRooms in sync with the Flask Schedule.
            syncAssignedRoomsFromSchedule(firebaseUser.uid, profileData);
            return;
          }
        } catch (err) {
          console.error('❌ Professor check failed:', err.message);
        }

        // Authenticated but not registered
        console.warn('⚠️ User authenticated but not registered as admin or professor:', firebaseUser.uid);
        await signOut(auth);
      } finally {
        hasResolvedInitialAuth.current = true;
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const logout = () => signOut(auth);

  const status = loading    ? 'loading'
    : !user                 ? 'unauthenticated'
    : isAdmin               ? 'admin'
    : profile               ? 'professor'
    : 'not-approved';

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, status, logout }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-surface-deep">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand mb-4"></div>
            <p className="text-slate-300">Loading...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
