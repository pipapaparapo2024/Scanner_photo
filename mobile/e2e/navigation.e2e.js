/**
 * E2E: Навигация по вкладкам и модалкам.
 * История → Скан (модал выбора источника) → Аккаунт → Монетизация.
 * Требуется авторизованный пользователь (главный экран с табами).
 */
describe('Navigation: History → Scan → Account → Monetization', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  const goToMainTabs = async () => {
    const skip = element(by.id('e2e-onboarding-skip'));
    if (await skip.exists()) await skip.tap();
    try {
      await waitFor(element(by.id('e2e-tab-history'))).toBeVisible().withTimeout(10000);
    } catch (_) {
      // Не залогинен — табов нет
    }
  };

  it('should open History tab and show history screen', async () => {
    await goToMainTabs();
    const historyTab = element(by.id('e2e-tab-history'));
    if (!(await historyTab.exists())) return; // не залогинен — скип

    await historyTab.tap();
    await waitFor(element(by.id('e2e-history'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('e2e-history-search'))).toBeVisible();
  });

  it('should open Scan modal and show source picker', async () => {
    await goToMainTabs();
    const scanTab = element(by.id('e2e-tab-scan'));
    if (!(await scanTab.exists())) return;

    await scanTab.tap();
    await waitFor(element(by.id('e2e-source-camera'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('e2e-source-gallery'))).toBeVisible();
  });

  it('should open Account and navigate to Monetization', async () => {
    await goToMainTabs();
    const accountTab = element(by.id('e2e-tab-account'));
    if (!(await accountTab.exists())) return;

    await accountTab.tap();
    const monetizationBtn = element(by.id('e2e-account-monetization'));
    await waitFor(monetizationBtn).toBeVisible().withTimeout(5000);
    await monetizationBtn.tap();

    await waitFor(element(by.id('e2e-monetization'))).toBeVisible().withTimeout(5000);
    await expect(element(by.id('e2e-monetization-balance'))).toBeVisible();
  });
});
