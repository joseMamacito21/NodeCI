const Page = require('./helpers/page');

let page;
const homeUrl = 'http://localhost:3000'
beforeEach(async () => {
  page = await Page.build();
  await page.goto(homeUrl);
});


describe('When logged in', async () => {
  beforeEach(async () => {
    await page.login();
    const selector = 'a.btn-floating';    
    await page.waitFor(selector);
    await page.click(selector);
  });

  test('Can see create blog form', async () => {
    const labelSelector = 'form label';
    const label = await page.getContentsOf(labelSelector);
    expect(label).toEqual('Blog Title');
  });

  describe('And entering invalid inputs', async () => {
    beforeEach(async () => {
      await page.click('form button');
    });

    test('The form shows error messages', async () => {
      const titleError = await page.getContentsOf('.title .red-text');
      const contentError = await page.getContentsOf('.content .red-text');
      expect(titleError).toEqual('You must provide a value');
      expect(contentError).toEqual('You must provide a value');
    });
  });

  describe('And entering valid inputs', () => {
    const title = 'My title';
    const content = 'My content';
    beforeEach(async () => {
      await page.type('.title input', title);
      await page.type('.content input', content);
      await page.click('form button');
    });

    test('Submitinf then shows confirm blog page', async () => {
      const text = await page.getContentsOf('h5');
      expect(text).toEqual('Please confirm your entries');
    });

    test('Submitting then shows the new blog in blog list page', async () => {
      await page.click('button.green');
      await page.waitFor('.card');
      const titleText = await page.getContentsOf('.card-title');
      const contentText = await page.getContentsOf('p');
      expect(titleText).toEqual(title);
      expect(contentText).toEqual(content);
    });
  }); 
});

describe('When not logged in', async () => {
  const actions = [
    {
      method: 'GET',
      path: '/api/blogs',
    },
    {
      method: 'POST',
      path: '/api/blogs',
      body: { title: 'My new title', content: 'My new content' },
    }
  ];

  test('Blog realted actions are prohibited', async () => {
    const results = await page.execRequests(actions);
    results.map(result => {
      expect(result).toEqual({ error: 'You must log in!' });
    })
  });
});

afterEach(async () => {
  await page.close();
});

