const path = require('path');
const fs = require('fs');
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

  /**
   * Upload a file to the remote server using WebDAV PUT
   * @param {string} localPath - Local file path
   * @param {string} remotePath - Remote path on server (e.g., /Documents/file.txt)
   * @param {Function} [progressCallback] - Optional callback for progress updates
   * @returns {Promise<Object>} Result object with status and data
   */
  async uploadFile(localPath, remotePath, progressCallback) {
    // Validate local file exists
    if (!fs.existsSync(localPath)) {
      return {
        status: 'error',
        data: { message: `錯誤: 檔案不存在 - ${localPath}` }
      };
    }

    const stats = fs.statSync(localPath);
    const fileSize = stats.size;
    const filename = path.basename(remotePath);
    
    // Ensure remotePath starts with /
    const normalizedRemotePath = remotePath.startsWith('/') ? remotePath : `/${remotePath}`;
    
    // WebDAV PUT endpoint
    const url = `/remote.php/webdav${normalizedRemotePath}`;
    
    // Read file content
    const fileContent = fs.readFileSync(localPath);
    
    let lastProgress = -1;
    const progressInterval = 5; // Update every 5%
    
    try {
      await this.client.request({
        method: 'PUT',
        url: url,
        data: fileContent,
        headers: {
          'requesttoken': this.requesttoken,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/octet-stream',
          'Content-Length': fileSize
        },
        onUploadProgress: (progressEvent) => {
          if (progressCallback && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // Only call callback every 5% or at 100%
            if (percent === 100 || percent - lastProgress >= progressInterval) {
              lastProgress = percent;
              const loadedMB = (progressEvent.loaded / 1024 / 1024).toFixed(1);
              const totalMB = (progressEvent.total / 1024 / 1024).toFixed(1);
              const elapsed = progressEvent.time ? progressEvent.time / 1000 : 1;
              const speedMBps = (progressEvent.loaded / 1024 / 1024 / elapsed).toFixed(1);
              progressCallback({
                percent,
                loaded: `${loadedMB} MB`,
                total: `${totalMB} MB`,
                speed: `${speedMBps} MB/s`
              });
            }
          }
        }
      });
      
      return { status: 'success', data: { path: remotePath } };
    } catch (err) {
      return {
        status: 'error',
        data: { message: err.response?.data || err.message }
      };
    }
  }
}

module.exports = SSPSpi;
