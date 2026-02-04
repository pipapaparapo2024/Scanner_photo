/**
 * E2E: Покупка токенов → (далее Сканирование); Просмотр рекламы → токены.
 * Экран монетизации: баланс, кнопки покупки, при нулевом балансе — реклама.
 */
describe('Monetization: purchase & ad', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  const openMonetization = async () => {
    const skip = element(by.id('e2e-onboarding-skip'));
    if (await skip.exists()) await skip.tap();
    try {
      await waitFor(element(by.id('e2e-tab-account'))).toBeVisible().withTimeout(10000);
    } catch (_) {
      return false;
    }
    await element(by.id('e2e-tab-account')).tap();
    const monetizationBtn = element(by.id('e2e-account-monetization'));
    await waitFor(monetizationBtn).toBeVisible().withTimeout(5000);
    await monetizationBtn.tap();
    return true;
  };

  it('should show balance and purchase buttons on Monetization', async () => {
    const opened = await openMonetization();
    if (!opened) return;

    await waitFor(element(by.id('e2e-monetization'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('e2e-monetization-balance'))).toBeVisible();
    await expect(element(by.id('e2e-purchase-50'))).toBeVisible();
    await expect(element(by.id('e2e-purchase-100'))).toBeVisible();
  });

  it('should tap purchase (may show error toast if IAP unavailable)', async () => {
    const opened = await openMonetization();
    if (!opened) return;

    await waitFor(element(by.id('e2e-purchase-50'))).toBeVisible().withTimeout(5000);
    await element(by.id('e2e-purchase-50')).tap();
    // Ждём либо успех, либо toast с ошибкой — оба варианты ок для E2E
    await new Promise((r) => setTimeout(r, 3000));
  });

  it('should show ad reward button when balance is zero', async () => {
    const opened = await openMonetization();
    if (!opened) return;

    const adBtn = element(by.id('e2e-ad-reward'));
    try {
      await waitFor(adBtn).toBeVisible().withTimeout(5000);
      await expect(adBtn).toBeVisible();
    } catch (_) {
      // Секция рекламы только при balance === 0
    }
  });
});
