describe('TÉCAP P0 flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });
  it('requires age consent before entering the app', async () => {
    await expect(element(by.text('Ce soir, tu fais quoi ?'))).toBeVisible();
    await element(by.id('email-input')).tap();
    await element(by.id('email-input')).typeText('qa@tecap.app');
    await element(by.text('Commencer')).tap();
    await expect(element(by.text('Encore une étape'))).toBeVisible();
  });
});
