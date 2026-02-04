import { firestore } from "../config/firebase";
import { UserDoc } from "../types/firestore";

const USERS_COLLECTION = "users";

export async function getUserById(userId: string): Promise<UserDoc | null> {
  const snap = await firestore.collection(USERS_COLLECTION).doc(userId).get();
  if (!snap.exists) return null;
  return snap.data() as UserDoc;
}

export async function createOrUpdateUser(user: UserDoc): Promise<void> {
  await firestore.collection(USERS_COLLECTION).doc(user.userId).set(user, {
    merge: true,
  });
}

export async function updateUserScanCredits(
  userId: string,
  delta: number,
): Promise<UserDoc> {
  const ref = firestore.collection(USERS_COLLECTION).doc(userId);

  await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = (snap.data() as UserDoc | undefined) ?? {
      userId,
      email: "",
      scanCredits: 0,
    };

    const newCredits = Math.max(0, (data.scanCredits ?? 0) + delta);
    const updated: UserDoc = {
      ...data,
      scanCredits: newCredits,
    };

    tx.set(ref, updated, { merge: true });
  });

  const updatedSnap = await ref.get();
  return updatedSnap.data() as UserDoc;
}


