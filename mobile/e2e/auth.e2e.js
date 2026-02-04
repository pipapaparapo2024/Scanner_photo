/**
 * E2E: Регистрация → (далее Сканирование, История)
 * Онбординг → Выбор авторизации → Регистрация → Экран ввода email.
 * Без бэкенда проверяем только навигацию до ввода кода.
 */
describe('Auth flow: onboarding → registration', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should skip onboarding and show auth choice', async () => {
    const skip = element(by.id('e2e-onboarding-skip'));
    const authRegister = element(by.id('e2e-auth-register'));

    if (await skip.exists()) await skip.tap();

    await waitFor(authRegister).toBeVisible().withTimeout(8000);
    await expect(authRegister).toBeVisible();
  });

  it('should open registration and show email screen', async () => {
    const skip = element(by.id('e2e-onboarding-skip'));
    const authRegister = element(by.id('e2e-auth-register'));

    if (await skip.exists()) await skip.tap();

    await waitFor(authRegister).toBeVisible().withTimeout(8000);
    await authRegister.tap();

    const emailInput = element(by.id('e2e-register-email'));
    await waitFor(emailInput).toBeVisible().withTimeout(5000);
    await expect(emailInput).toBeVisible();
    await expect(element(by.id('e2e-register-continue'))).toBeVisible();
  });
});
