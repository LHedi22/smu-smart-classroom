// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);  // Firebase Auth user
  const [profile, setProfile]     = useState(null);  // /professors/{uid} data
  const [isAdmin, setIsAdmin]     = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Check if admin (permission denied = not an admin, continue)
      try {
        const adminSnap = await get(ref(db, `/admins/${firebaseUser.uid}`));
        if (adminSnap.exists()) {
          console.log('✅ Admin detected:', firebaseUser.uid);
          setUser(firebaseUser);
          setIsAdmin(true);
          setProfile(null);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('⚠️ Admin check failed (expected if not admin):', err.message);
      }

      // Check if professor
      const profSnap = await get(ref(db, `/professors/${firebaseUser.uid}`));
      if (profSnap.exists()) {
        console.log('✅ Professor detected:', firebaseUser.uid);
        setUser(firebaseUser);
        setProfile(profSnap.val());
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Authenticated but not registered
      console.warn('⚠️ User authenticated but not registered as admin or professor:', firebaseUser.uid);
      await signOut(auth);
      setLoading(false);
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