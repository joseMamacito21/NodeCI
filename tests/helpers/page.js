const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const customPage = new CustomPage(page);
    return new Proxy(customPage, {
      get: function(target, property) {
        return target[property]|| browser[property] || page[property];
      }
    })
  }

  constructor(page) {
    this.page = page;
  }


  async login() {
    const selector = 'a[href="/auth/logout"]';
    const homeUrl = 'http://localhost:3000/blogs';
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);
    await this.page.setCookie({ name: 'session', value: session });
    await this.page.setCookie({ name: 'session.sig', value: sig });
    await this.page.goto(homeUrl);
    await this.page.waitFor(selector);
  }

  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML);
  }

  async fetchRequest(path, method, body = {}) {
    return this.page.evaluate(async (_path, _method, _body) => {
      let options = {
        method: _method,
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        }
      };
      if(Object.keys(_body).length > 0) {
        options.body = JSON.stringify(_body);
      };
      return fetch(_path, options).then(res => res.json());
    }, path, method, body);
  }

  execRequests(actions) {
    return Promise.all(
      actions.map(({method, path, body}) => {
        return this.fetchRequest(path, method, body);
      })
    );
  }
}; 

module.exports = CustomPage;