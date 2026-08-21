const SSPClient = require('./sspClient');

class SSPSpi extends SSPClient {
  async listFiles(dir = '/') {
    const res = await this.request('GET', `/index.php/apps/files/ajax/list.php?dir=${encodeURIComponent(dir)}`);
    return res;
  }

  async deleteFile(dir = '/', filename) {
    const params = new URLSearchParams();
    params.append('dir', dir);
    params.append('files', JSON.stringify([filename]));

    const res = await this.request('POST', '/index.php/apps/files/ajax/delete.php', {
      data: params.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      }
    });
    return res;
  }
}

module.exports = SSPSpi;
