"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import {
  completeGoogleRedirect,
  getFirebaseAuth,
  isFirebaseConfigured,
  signInWithGoogle,
} from "@/lib/firebase/client";
import { isDrinkId, type DrinkId } from "@/lib/taste";
import {
  addFavorite,
  loadUserTaste,
  removeFavorite,
  savePreferredDrinks,
} from "@/lib/user-store";

type PendingAction =
  | { type: "favorite"; cafeId: string }
  | { type: "drinks" }
  | null;

type TasteContextValue = {
  ready: boolean;
  configured: boolean;
  user: User | null;
  preferredDrinkIds: DrinkId[];
  favoriteCafeIds: ReadonlySet<string>;
  loginOpen: boolean;
  drinksOpen: boolean;
  loginHint: string | null;
  requestFavorite: (cafeId: string) => void;
  requestLogin: () => void;
  requestDrinks: () => void;
  setDrinkChecked: (id: DrinkId, checked: boolean) => void;
  signInGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  dismissLogin: () => void;
  dismissDrinks: () => void;
};

const TasteContext = createContext<TasteContextValue | null>(null);

const PENDING_KEY = "abara:auth-pending";

function writePending(action: PendingAction) {
  try {
    if (action) sessionStorage.setItem(PENDING_KEY, JSON.stringify(action));
    else sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

function takePending(): PendingAction {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingAction;
    if (!parsed || typeof parsed !== "object" || !("type" in parsed)) return null;
    if (parsed.type === "favorite" && typeof parsed.cafeId === "string") return parsed;
    if (parsed.type === "drinks") return parsed;
    return null;
  } catch {
    return null;
  }
}

function loginMessage(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";

  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return null;
  }
  if (code === "auth/unauthorized-domain") {
    return "이 주소는 아직 로그인을 못 열어요";
  }
  if (code === "auth/popup-blocked") {
    return "팝업이 막혀 있어요. 다시 눌러 주세요";
  }
  return "로그인하지 못했어요";
}

export function TasteProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [ready, setReady] = useState(!configured);
  const [user, setUser] = useState<User | null>(null);
  const [preferredDrinkIds, setPreferredDrinkIds] = useState<DrinkId[]>([]);
  const [favoriteCafeIds, setFavoriteCafeIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [loginOpen, setLoginOpen] = useState(false);
  const [drinksOpen, setDrinksOpen] = useState(false);
  const [loginHint, setLoginHint] = useState<string | null>(null);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);
  const pendingRef = useRef<PendingAction>(null);
  const userRef = useRef<User | null>(null);
  const favoriteCafeIdsRef = useRef(favoriteCafeIds);
  const preferredDrinkIdsRef = useRef(preferredDrinkIds);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    favoriteCafeIdsRef.current = favoriteCafeIds;
  }, [favoriteCafeIds]);

  useEffect(() => {
    preferredDrinkIdsRef.current = preferredDrinkIds;
  }, [preferredDrinkIds]);

  const applyTaste = useCallback((taste: { preferredDrinkIds: DrinkId[]; favoriteCafeIds: string[] }) => {
    setPreferredDrinkIds(taste.preferredDrinkIds);
    setFavoriteCafeIds(new Set(taste.favoriteCafeIds));
  }, []);

  useEffect(() => {
    if (!configured) return;

    const auth = getFirebaseAuth();
    if (!auth) {
      setReady(true);
      return;
    }

    void completeGoogleRedirect(auth).catch((error) => {
      const message = loginMessage(error);
      if (message) {
        setLoginHint(message);
        setLoginOpen(true);
      }
    });

    const unsub = onAuthStateChanged(auth, async (next) => {
      setUser(next);
      if (!next) {
        setPreferredDrinkIds([]);
        setFavoriteCafeIds(new Set());
        setLoadedUid(null);
        setReady(true);
        return;
      }

      try {
        applyTaste(await loadUserTaste(next.uid));
      } catch {
        applyTaste({ preferredDrinkIds: [], favoriteCafeIds: [] });
      } finally {
        setLoadedUid(next.uid);
        setReady(true);
      }
    });

    return () => unsub();
  }, [applyTaste, configured]);

  const requestFavorite = useCallback((cafeId: string) => {
    if (!configured) {
      setLoginHint("로그인을 아직 못 열어요");
      setLoginOpen(true);
      return;
    }

    const current = userRef.current;
    if (!current) {
      pendingRef.current = { type: "favorite", cafeId };
      writePending(pendingRef.current);
      setLoginHint(null);
      setLoginOpen(true);
      return;
    }

    void (async () => {
      const liked = favoriteCafeIdsRef.current.has(cafeId);
      setFavoriteCafeIds((prev) => {
        const next = new Set(prev);
        if (liked) next.delete(cafeId);
        else next.add(cafeId);
        return next;
      });
      try {
        if (liked) await removeFavorite(current.uid, cafeId);
        else await addFavorite(current.uid, cafeId);
      } catch {
        setFavoriteCafeIds((prev) => {
          const next = new Set(prev);
          if (liked) next.add(cafeId);
          else next.delete(cafeId);
          return next;
        });
      }
    })();
  }, [configured]);

  const requestLogin = useCallback(() => {
    if (!configured) {
      setLoginHint("로그인을 아직 못 열어요");
      setLoginOpen(true);
      return;
    }

    if (userRef.current) return;

    pendingRef.current = null;
    writePending(null);
    setLoginHint(null);
    setLoginOpen(true);
  }, [configured]);

  const requestDrinks = useCallback(() => {
    if (!configured) {
      setLoginHint("로그인을 아직 못 열어요");
      setLoginOpen(true);
      return;
    }

    if (!userRef.current) {
      pendingRef.current = { type: "drinks" };
      writePending(pendingRef.current);
      setLoginHint(null);
      setLoginOpen(true);
      return;
    }

    setDrinksOpen(true);
  }, [configured]);

  const setDrinkChecked = useCallback((id: DrinkId, checked: boolean) => {
    const current = userRef.current;
    if (!current || !isDrinkId(id)) return;

    const previous = preferredDrinkIdsRef.current;
    const next = checked
      ? [...previous, id].filter((item, index, all) => all.indexOf(item) === index)
      : previous.filter((item) => item !== id);

    setPreferredDrinkIds(next);
    void savePreferredDrinks(current.uid, next).catch(() => {
      setPreferredDrinkIds(previous);
    });
  }, []);

  const signInGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoginHint("로그인을 아직 못 열어요");
      return;
    }

    setLoginHint(null);
    writePending(pendingRef.current);
    try {
      await signInWithGoogle(auth);
      setLoginOpen(false);
    } catch (error) {
      const message = loginMessage(error);
      if (message) setLoginHint(message);
    }
  }, []);

  useEffect(() => {
    if (!user || loadedUid !== user.uid) return;
    const pending = pendingRef.current ?? takePending();
    if (!pending) return;
    pendingRef.current = null;
    writePending(null);
    if (pending.type === "favorite") requestFavorite(pending.cafeId);
    if (pending.type === "drinks") setDrinksOpen(true);
  }, [loadedUid, requestFavorite, user]);

  const signOutUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
    setDrinksOpen(false);
    setPreferredDrinkIds([]);
    setFavoriteCafeIds(new Set());
  }, []);

  const value = useMemo<TasteContextValue>(
    () => ({
      ready,
      configured,
      user,
      preferredDrinkIds,
      favoriteCafeIds,
      loginOpen,
      drinksOpen,
      loginHint,
      requestFavorite,
      requestLogin,
      requestDrinks,
      setDrinkChecked,
      signInGoogle,
      signOutUser,
      dismissLogin: () => {
        pendingRef.current = null;
        writePending(null);
        setLoginOpen(false);
        setLoginHint(null);
      },
      dismissDrinks: () => setDrinksOpen(false),
    }),
    [
      configured,
      drinksOpen,
      favoriteCafeIds,
      loginHint,
      loginOpen,
      preferredDrinkIds,
      ready,
      requestDrinks,
      requestFavorite,
      requestLogin,
      setDrinkChecked,
      signInGoogle,
      signOutUser,
      user,
    ],
  );

  return <TasteContext.Provider value={value}>{children}</TasteContext.Provider>;
}

export function useTaste() {
  const value = useContext(TasteContext);
  if (!value) throw new Error("useTaste needs TasteProvider");
  return value;
}
