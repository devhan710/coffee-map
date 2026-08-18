import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { getCafeById } from "@/lib/cafes";
import { normalizeDrinkIds, type DrinkId } from "@/lib/taste";

export type UserTaste = {
  preferredDrinkIds: DrinkId[];
  favoriteCafeIds: string[];
};

function requireDb() {
  const db = getFirebaseDb();
  if (!db) throw new Error("firebase-missing");
  return db;
}

export async function loadUserTaste(uid: string): Promise<UserTaste> {
  const db = requireDb();
  const userSnap = await getDoc(doc(db, "users", uid));
  const favoriteSnap = await getDocs(collection(db, "users", uid, "favorites"));

  return {
    preferredDrinkIds: normalizeDrinkIds(userSnap.data()?.preferredDrinkIds),
    favoriteCafeIds: favoriteSnap.docs
      .map((item) => item.id)
      .filter((cafeId) => Boolean(getCafeById(cafeId))),
  };
}

export async function savePreferredDrinks(uid: string, drinkIds: DrinkId[]) {
  const db = requireDb();
  await setDoc(doc(db, "users", uid), {
    preferredDrinkIds: normalizeDrinkIds(drinkIds),
    updatedAt: serverTimestamp(),
  });
}

export async function addFavorite(uid: string, cafeId: string) {
  if (!getCafeById(cafeId)) throw new Error("없는 카페");

  const db = requireDb();
  await setDoc(doc(db, "users", uid, "favorites", cafeId), {
    cafeId,
    createdAt: serverTimestamp(),
  });
}

export async function removeFavorite(uid: string, cafeId: string) {
  const db = requireDb();
  await deleteDoc(doc(db, "users", uid, "favorites", cafeId));
}
