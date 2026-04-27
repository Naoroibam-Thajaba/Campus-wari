import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getCurrentUser,
  signOut as storeSignOut,
  subscribe,
  type LocalUser,
} from "@/lib/store";

type AuthCtx = {
  user: LocalUser | null;
  loading: boolean;
  refresh: () => void;
};

const Ctx = createContext<AuthCtx>({ user: null, loading: true, refresh: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  function refresh() {
    setUser(getCurrentUser());
  }

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);
    const unsub = subscribe((key) => {
      if (key === "cw.session" || key === "cw.users") {
        setUser(getCurrentUser());
      }
    });
    return unsub;
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

export async function signOut() {
  await storeSignOut();
}
