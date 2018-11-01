const Page = require('./helpers/page');

let page;
beforeEach(async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
});

test('The header has the correct text', async () => {
  const text = await page.getContentsOf('a.brand-logo');
  expect(text).toEqual('Blogster');
});

test('Clicking login starts oauth flow', async () => {
  await page.click('.right a', el => el.innerHTML);
  const url = await page.url();
  expect(url).toContain('https://accounts.google.com/o/oauth2/v2/');
});

test('When signed in, shows logout button', async () => {
  await page.login();
  const text = await page.getContentsOf('a[href="/auth/logout"]');
  expect(text).toEqual('Logout');
});

afterEach(async () => {
  await page.close();
});