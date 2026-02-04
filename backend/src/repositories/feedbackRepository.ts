import { firestore } from "../config/firebase";
import type { FeedbackDoc } from "../types/firestore";

const FEEDBACK_COLLECTION = "feedback";

/**
 * Сохранить обратную связь в Firestore
 */
export async function saveFeedback(feedback: FeedbackDoc): Promise<void> {
  await firestore
    .collection(FEEDBACK_COLLECTION)
    .doc(feedback.feedbackId)
    .set(feedback);
}
