const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

class SSPClient {
  constructor(baseURL = 'https://ssp.mailcloud.com.tw') {
    this.baseURL = baseURL;
    this.jar = new CookieJar();
    this.client = wrapper(axios.create({
      baseURL: this.baseURL,
      jar: this.jar,
      withCredentials: true
    }));
    this.requesttoken = null;
  }

  async login(username, password) {
    // 1. Get login page to extract requesttoken & establish cookies
    const res = await this.client.get('/index.php/login');
    const html = res.data;

    const tokenMatch = html.match(/name="requesttoken" value="([^"]+)"/);
    if (tokenMatch) {
      this.requesttoken = tokenMatch[1];
    } else {
      throw new Error('Failed to extract CSRF requesttoken from login page.');
    }

    // 2. Perform POST login
    const params = new URLSearchParams();
    params.append('user', username);
    params.append('password', password);
    params.append('timezone-offset', '8');
    params.append('requesttoken', this.requesttoken);

    const loginRes = await this.client.post('/index.php/login', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'requesttoken': this.requesttoken,
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    // 3. Verify the session is actually usable before returning credentials.
    // The server may return HTTP 200 for failed logins (e.g. wrong password),
    // so a protected request is required to confirm the session truly works.
    try {
      await this.client.request({
        method: 'PROPFIND',
        url: '/remote.php/webdav/',
        headers: {
          'requesttoken': this.requesttoken,
          'X-Requested-With': 'XMLHttpRequest',
          'Depth': '0'
        }
      });
    } catch (verifyErr) {
      throw new Error('Login failed - Session verification failed');
    }

    return {
      success: true,
      requesttoken: this.requesttoken,
      cookies: this.getCookieString()
    };
  }

  // 匯出 Cookie 狀態 (serialized JSON)
  getCookieString() {
    return JSON.stringify(this.jar.serializeSync());
  }

  // 載入 Cookie 狀態
  setCookieString(cookieJsonStr) {
    if (cookieJsonStr) {
      try {
        const obj = typeof cookieJsonStr === 'string' ? JSON.parse(cookieJsonStr) : cookieJsonStr;
        this.jar = CookieJar.deserializeSync(obj);
        this.client.defaults.jar = this.jar;
      } catch (err) {
        // ignore
      }
    }
  }

  async request(method, url, options = {}) {
    if (!options.headers) {
      options.headers = {};
    }
    if (this.requesttoken) {
      options.headers['requesttoken'] = this.requesttoken;
    }
    options.headers['X-Requested-With'] = 'XMLHttpRequest';

    const res = await this.client.request({
      method,
      url,
      ...options
    });
    return res.data;
  }
}

module.exports = SSPClient;
