const path = require('path');
const SSPClient = require('./sspClient');

class SSPSpi extends SSPClient {
  async listFiles(dir = '/') {
    const res = await this.request('GET', `/index.php/apps/files/ajax/list.php?dir=${encodeURIComponent(dir)}`);
    return res;
  }

  async deleteFile(dir = '/', filename) {
    const cleanFilename = filename.trim();
    // 優先使用 WebDAV DELETE，避免 ownCloud AJAX 刪除中文檔名的路徑解析 Bug
    // 已知限制：此 Mailcloud 伺服器的 WebDAV DELETE 回傳 204 但不實際刪除檔案
    // 英文檔名可用 AJAX delete.php 正常刪除
    const webdavPath = cleanFilename;
    const url = `/remote.php/webdav/${webdavPath}`;

    try {
      await this.client.request({
        method: 'DELETE',
        url: url,
        headers: {
          'requesttoken': this.requesttoken,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      return { status: 'success' };
    } catch (err) {
      // 回退嘗試 AJAX delete.php（僅適用於無中文/特殊字元的檔名）
      if (!/[^\x00-\x7F]/.test(cleanFilename) && !/[() ]/.test(cleanFilename)) {
        try {
          const params = new URLSearchParams();
          params.append('dir', dir);
          params.append('files', JSON.stringify([cleanFilename]));
          const res = await this.request('POST', '/index.php/apps/files/ajax/delete.php', {
            data: params.toString(),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            }
          });
          return res;
        } catch (ajaxErr) {
          // ignore fallback error
        }
      }
      return {
        status: 'error',
        data: { message: err.response?.data || err.message }
      };
    }
  }
}

module.exports = SSPSpi;
