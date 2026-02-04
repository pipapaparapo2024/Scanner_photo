import { firestore } from "../config/firebase";
import { RewardTokenDoc } from "../types/firestore";

const REWARD_TOKENS_COLLECTION = "reward_tokens";

export async function createRewardToken(
  token: RewardTokenDoc,
): Promise<void> {
  await firestore
    .collection(REWARD_TOKENS_COLLECTION)
    .doc(token.token)
    .set(token);
}

export async function useRewardToken(
  tokenId: string,
): Promise<RewardTokenDoc | null> {
  const ref = firestore.collection(REWARD_TOKENS_COLLECTION).doc(tokenId);

  let usedToken: RewardTokenDoc | null = null;

  await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      usedToken = null;
      return;
    }
    const data = snap.data() as RewardTokenDoc;
    if (data.isUsed) {
      usedToken = null;
      return;
    }

    const updated: RewardTokenDoc = {
      ...data,
      isUsed: true,
    };
    tx.set(ref, updated, { merge: true });
    usedToken = updated;
  });

  return usedToken;
}


