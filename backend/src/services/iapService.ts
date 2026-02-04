import axios from "axios";
import { updateUserScanCredits } from "../repositories/userRepository";
import { ValidationError } from "../utils/errors";

// Маппинг productId -> количество сканов
const PRODUCT_CREDITS: Record<string, number> = {
  pack_50_scans: 50,
  pack_100_scans: 100,
};

export interface IapVerifyInput {
  userId: string;
  productId: string;
  purchaseToken: string;
  orderId?: string;
}

export async function verifyAndApplyIap(
  input: IapVerifyInput,
): Promise<{ addedCredits: number; totalCredits: number }> {
  const credits = PRODUCT_CREDITS[input.productId];
  if (!credits) {
    throw new ValidationError("Unknown productId", "productId");
  }

  // TODO: Реальная интеграция с RuStore Server API.
  // Здесь оставляем заглушку, которую ты потом заменишь реальным запросом.
  const rustoreEndpoint = process.env.RUSTORE_VERIFY_URL;
  const rustoreToken = process.env.RUSTORE_API_TOKEN;

  if (!rustoreEndpoint || !rustoreToken) {
    // В дев-окружении можно пропустить реальную проверку
    // и считать покупку валидной, НО в проде это надо включить.
    // eslint-disable-next-line no-console
    console.warn("RuStore verification is not configured, skipping check");
  } else {
    await axios.post(
      rustoreEndpoint,
      {
        purchaseToken: input.purchaseToken,
        productId: input.productId,
        orderId: input.orderId,
        userId: input.userId,
      },
      {
        headers: {
          Authorization: `Bearer ${rustoreToken}`,
        },
      },
    );
  }

  const updatedUser = await updateUserScanCredits(input.userId, credits);

  return { addedCredits: credits, totalCredits: updatedUser.scanCredits };
}


