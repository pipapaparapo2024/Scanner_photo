import { apiClient } from "../../../shared/lib/api";
import { API_ENDPOINTS } from "../../../shared/config";

export interface FeedbackRequest {
  subject: string;
  message: string;
  email?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
}

/**
 * Отправить обратную связь
 */
export async function submitFeedback(data: FeedbackRequest): Promise<FeedbackResponse> {
  return apiClient.post<FeedbackResponse>(API_ENDPOINTS.feedback.submit, data);
}
