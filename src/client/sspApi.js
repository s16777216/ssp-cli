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

    // Ensure remotePath starts with /
    const normalizedRemotePath = remotePath.startsWith('/') ? remotePath : `/${remotePath}`;

    // 當目標為目錄（結尾帶 /，如 /Docs/）時，將本機檔名拼接至目錄路徑內，保留原檔名
    // 否則維持使用者指定的完整檔案路徑
    const isDirectoryTarget = normalizedRemotePath.endsWith('/');
    const targetPath = isDirectoryTarget
      ? `${normalizedRemotePath}${path.basename(localPath)}`
      : normalizedRemotePath;

    // WebDAV PUT endpoint
    const url = `/remote.php/webdav${targetPath}`;
    
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

  /**
   * Download a file from the remote server using WebDAV GET
   * @param {string} remotePath - Remote path on server (e.g., /Documents/file.txt)
   * @param {string} localPath - Local file path to save to
   * @param {Function} [progressCallback] - Optional callback for progress updates
   * @returns {Promise<Object>} Result object with status and data
   */
  async downloadFile(remotePath, localPath, progressCallback) {
    // Ensure remotePath starts with /
    const normalizedRemotePath = remotePath.startsWith('/') ? remotePath : `/${remotePath}`;
    
    // WebDAV GET endpoint
    const url = `/remote.php/webdav${normalizedRemotePath}`;
    
    let lastProgress = -1;
    const progressInterval = 5; // Update every 5%
    const startTime = Date.now();
    
    try {
      const response = await this.client.request({
        method: 'GET',
        url: url,
        responseType: 'stream',
        headers: {
          'requesttoken': this.requesttoken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        onDownloadProgress: (progressEvent) => {
          if (progressCallback && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // Only call callback every 5% or at 100%
            if (percent === 100 || percent - lastProgress >= progressInterval) {
              lastProgress = percent;
              const loadedMB = (progressEvent.loaded / 1024 / 1024).toFixed(1);
              const totalMB = (progressEvent.total / 1024 / 1024).toFixed(1);
              const elapsed = (Date.now() - startTime) / 1000;
              const speedMBps = elapsed > 0 ? (progressEvent.loaded / 1024 / 1024 / elapsed).toFixed(1) : '0.0';
              progressCallback({
                percent,
                loaded: `${loadedMB} MB`,
                total: `${totalMB} MB`,
                speed: `${speedMBps} MB/s`
              });
            }
          }
        },
        validateStatus: (status) => status < 500 // Don't throw on 4xx, handle manually
      });
      
      // Check for HTTP error status
      if (response.status >= 400) {
        let errorMsg = `HTTP ${response.status}`;
        if (response.data) {
          // Try to read error response body
          const chunks = [];
          for await (const chunk of response.data) {
            chunks.push(chunk);
          }
          const errorBody = Buffer.concat(chunks).toString('utf8');
          try {
            const errorJson = JSON.parse(errorBody);
            errorMsg = errorJson.message || errorJson.error || errorBody;
          } catch (e) {
            errorMsg = errorBody || `HTTP ${response.status}`;
          }
        }
        return {
          status: 'error',
          data: { message: errorMsg }
        };
      }
      
      // Save stream to file
      const writer = fs.createWriteStream(localPath);
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          resolve({ status: 'success', data: { path: localPath } });
        });
        writer.on('error', (err) => {
          reject({ status: 'error', data: { message: err.message } });
        });
      });
    } catch (err) {
      return {
        status: 'error',
        data: { message: err.response?.data || err.message }
      };
    }
  }

  /**
   * Create a folder on the remote server using WebDAV MKCOL
   * @param {string} remotePath - Remote path on server (e.g., /Documents/NewFolder)
   * @param {Object} options - Options
   * @param {boolean} options.recursive - Create parent directories recursively (-p flag)
   * @returns {Promise<Object>} Result object with status and data
   */
  async createFolder(remotePath, options = {}) {
    const { recursive = false } = options;
    
    // Ensure remotePath starts with /
    const normalizedRemotePath = remotePath.startsWith('/') ? remotePath : `/${remotePath}`;
    
    // WebDAV MKCOL endpoint
    const url = `/remote.php/webdav${normalizedRemotePath}`;
    
    const mkcolRequest = async (path) => {
      try {
        await this.client.request({
          method: 'MKCOL',
          url: `/remote.php/webdav${path}`,
          headers: {
            'requesttoken': this.requesttoken,
            'X-Requested-With': 'XMLHttpRequest'
          },
          validateStatus: (status) => status < 500
        });
        return { status: 'success' };
      } catch (err) {
        // Check for specific error status
        if (err.response) {
          const status = err.response.status;
          if (status === 405) {
            return { status: 'error', data: { message: `錯誤: 資料夾已存在 - ${normalizedRemotePath}` } };
          }
          if (status === 409) {
            return { status: 'error', data: { message: `錯誤: 父目錄不存在` } };
          }
          if (status === 403) {
            return { status: 'error', data: { message: `錯誤: 權限不足` } };
          }
        }
        return {
          status: 'error',
          data: { message: err.response?.data || err.message }
        };
      }
    };

    if (recursive) {
      // Parse path segments and create parent directories recursively
      const pathSegments = normalizedRemotePath.split('/').filter(s => s.length > 0);
      let currentPath = '';
      
      for (const segment of pathSegments) {
        currentPath += `/${segment}`;
        // Try to create each level, ignore "already exists" errors
        const result = await mkcolRequest(currentPath);
        if (result.status === 'error' && !result.data.message.includes('已存在')) {
          return result;
        }
      }
      return { status: 'success', data: { path: normalizedRemotePath } };
    } else {
      // Single directory creation
      return await mkcolRequest(normalizedRemotePath);
    }
  }

  /**
   * Copy a file or folder on the remote server using WebDAV COPY
   * @param {string} src - Remote source path (e.g., /Documents/file.txt)
   * @param {string} dst - Remote destination path (exact target path)
   * @param {Object} options - Options
   * @param {boolean} options.overwrite - Whether to overwrite existing target (Overwrite: T)
   * @returns {Promise<Object>} Result object. status: 'success' | 'exists' (412) | 'error'
   */
  async copyFile(src, dst, options = {}) {
    const { overwrite = false } = options;
    const normalizedSrc = src.startsWith('/') ? src : `/${src}`;
    const normalizedDst = dst.startsWith('/') ? dst : `/${dst}`;
    const url = `/remote.php/webdav${normalizedSrc}`;
    const destFull = `${this.baseURL}/remote.php/webdav${normalizedDst}`;

    try {
      const response = await this.client.request({
        method: 'COPY',
        url: url,
        headers: {
          'requesttoken': this.requesttoken,
          'X-Requested-With': 'XMLHttpRequest',
          'Destination': destFull,
          'Overwrite': overwrite ? 'T' : 'F'
        },
        validateStatus: (status) => status < 500 // Don't throw on 4xx, handle manually
      });

      // 4xx handled here (validateStatus: <500 不 throw，response 含 status)
      if (response.status === 412) {
        return {
          status: 'exists',
          data: { message: `錯誤: 目標已存在 - ${normalizedDst}` }
        };
      }
      if (response.status === 404) {
        return {
          status: 'error',
          data: { message: `錯誤: 來源不存在 - ${normalizedSrc}` }
        };
      }
      if (response.status === 403) {
        return {
          status: 'error',
          data: { message: `錯誤: 權限不足` }
        };
      }
      if (response.status >= 400) {
        return {
          status: 'error',
          data: { message: `錯誤: 複製失敗 - HTTP ${response.status}` }
        };
      }

      return { status: 'success' };
    } catch (err) {
      // 5xx 或網路錯誤
      return {
        status: 'error',
        data: { message: err.response?.data || err.message }
      };
    }
  }

  /**
   * Determine the type (file or collection) of a remote path using WebDAV PROPFIND Depth:0
   * @param {string} remotePath - Remote path (e.g., /Documents/file.txt)
   * @returns {Promise<Object>} Result object with data.type: 'file' | 'collection'
   */
  async statPath(remotePath) {
    const normalized = remotePath.startsWith('/') ? remotePath : `/${remotePath}`;
    const url = `/remote.php/webdav${normalized}`;

    try {
      const response = await this.client.request({
        method: 'PROPFIND',
        url: url,
        headers: {
          'requesttoken': this.requesttoken,
          'X-Requested-With': 'XMLHttpRequest',
          'Depth': '0'
        },
        validateStatus: (status) => status < 500 // Don't throw on 4xx, handle manually
      });

      if (response.status === 404) {
        return {
          status: 'error',
          data: { message: `錯誤: 來源不存在 - ${normalized}`, code: 404 }
        };
      }
      if (response.status >= 400) {
        return {
          status: 'error',
          data: { message: `錯誤: 無法取得來源資訊 - HTTP ${response.status}` }
        };
      }

      // resourcetype 內的 <collection/> 表資料夾，否則為檔案
      // 真實 ownCloud 回傳命名空間前綴為小寫 `d:`（xmlns:d="DAV:"），故以 /i 大小寫不敏感匹配
      const xml = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const isCollection = /<d?:resourcetype>[\s\S]*?<d?:collection\s*\/>[\s\S]*?<\/d?:resourcetype>/i.test(xml);
      return {
        status: 'success',
        data: { type: isCollection ? 'collection' : 'file' }
      };
    } catch (err) {
      return {
        status: 'error',
        data: { message: err.response?.data || err.message }
      };
    }
  }

  /**
   * Search files on the remote server using AJAX search endpoint
   * @param {string} keyword - Search keyword
   * @param {Object} options - Options
   * @param {string} options.type - Filter by type: 'file' | 'dir' | 'all' (default: 'all')
   * @param {boolean} options.content - Search file content (requires server full-text index)
   * @returns {Promise<Object>} Result object with status and data
   */
  async searchFiles(keyword, options = {}) {
    const { type = 'all', content = false } = options;
    
    // Try modern search endpoint first (ownCloud 10+), fallback to legacy
    const endpoints = [
      '/index.php/search/ajax/search.php',
      '/index.php/apps/files/ajax/search.php'
    ];
    
    for (const endpoint of endpoints) {
      // Build query parameters
      const params = new URLSearchParams();
      // Modern endpoint uses 'query', legacy uses 'search'
      const queryParam = endpoint.includes('/search/ajax/') ? 'query' : 'search';
      params.append(queryParam, keyword);
      
      if (endpoint.includes('/search/ajax/')) {
        params.append('inApps[]', 'files');
      }
      
      if (type !== 'all') {
        params.append('type', type);
      }
      
      if (content) {
        params.append('content', '1');
      }
      
      const url = `${endpoint}?${params.toString()}`;
      
      try {
        // Use client.request directly to get full response with status code
        const response = await this.client.request({
          method: 'GET',
          url: url,
          headers: {
            'requesttoken': this.requesttoken,
            'X-Requested-With': 'XMLHttpRequest'
          },
          validateStatus: (status) => status < 500
        });
        
        // Check HTTP status code
        if (response.status === 404) {
          continue; // Try next endpoint
        }
        
        // Parse response body
        const body = response.data;
        
        // Modern endpoint (search/ajax): returns {data: [...], total: N} or {status: "error", data: {...}}
        // Legacy endpoint (files/ajax): returns {status: "success", data: {files: [...]}} or error
        let files = [];
        
        if (Array.isArray(body?.data)) {
          // Modern format: {data: [...], total: N}
          files = body.data;
        } else if (body?.status === 'success' && Array.isArray(body?.data?.files)) {
          // Legacy format: {status: "success", data: {files: [...]}}
          files = body.data.files;
        } else if (body?.status === 'success' && Array.isArray(body?.data?.elements)) {
          // Other format: {status: "success", data: {elements: [...]}}
          files = body.data.elements;
        } else if (body && body.status === 'error') {
          // API error - try next endpoint
          continue;
        }
        
        if (files.length > 0 || files.length === 0) {
          // Filter by type if specified
          let filtered = files;
          if (type === 'file') {
            filtered = files.filter(f => f.type === 'file');
          } else if (type === 'dir') {
            filtered = files.filter(f => f.type === 'dir' || f.type === 'folder');
          }
          
          return {
            status: 'success',
            data: { files: filtered }
          };
        }
      } catch (err) {
        // Network error or 4xx/5xx that threw
        if (err.response?.status === 404) {
          continue; // Try next endpoint
        }
        return {
          status: 'error',
          data: { message: err.response?.data || err.message }
        };
      }
    }
    
    // All endpoints failed
    return {
      status: 'error',
      data: { message: '搜尋端點不可用' }
    };
  }

  /**
   * Move/rename a file or folder on the remote server using WebDAV MOVE
   * @param {string} src - Remote source path (e.g., /Documents/file.txt)
   * @param {string} dst - Remote destination path (exact target path)
   * @param {Object} options - Options
   * @param {boolean} options.overwrite - Whether to overwrite existing target (Overwrite: T)
   * @returns {Promise<Object>} Result object. status: 'success' | 'exists' (412) | 'cross-fs' | 'error'
   */
  async moveFile(src, dst, options = {}) {
    const { overwrite = false } = options;
    const normalizedSrc = src.startsWith('/') ? src : `/${src}`;
    const normalizedDst = dst.startsWith('/') ? dst : `/${dst}`;
    const url = `/remote.php/webdav${normalizedSrc}`;
    const destFull = `${this.baseURL}/remote.php/webdav${normalizedDst}`;

    try {
      const response = await this.client.request({
        method: 'MOVE',
        url: url,
        headers: {
          'requesttoken': this.requesttoken,
          'X-Requested-With': 'XMLHttpRequest',
          'Destination': destFull,
          'Overwrite': overwrite ? 'T' : 'F'
        },
        validateStatus: (status) => status < 500 // Don't throw on 4xx, handle manually
      });

      // 4xx handled here (validateStatus: <500 不 throw，response 含 status)
      if (response.status === 412) {
        return {
          status: 'exists',
          data: { message: `Error: 目標已存在 - ${normalizedDst}` }
        };
      }
      if (response.status === 404) {
        return {
          status: 'error',
          data: { message: `Error: 來源不存在 - ${normalizedSrc}` }
        };
      }
      if (response.status === 403) {
        return {
          status: 'error',
          data: { message: `Error: 權限不足` }
        };
      }
      // Cross-filesystem move not supported (some servers return 409 or 501)
      if (response.status === 409 || response.status === 501) {
        return {
          status: 'cross-fs',
          data: { message: `Error: 不支援跨儲存空間移動，請改用 cp + rm` }
        };
      }
      if (response.status >= 400) {
        return {
          status: 'error',
          data: { message: `Error: 移動失敗 - HTTP ${response.status}` }
        };
      }

      return { status: 'success' };
    } catch (err) {
      // 5xx 或網路錯誤
      return {
        status: 'error',
        data: { message: err.response?.data || err.message }
      };
    }
  }

  /**
   * Logout from the server by calling the logout API
   * @returns {Promise<Object>} Result object with status and data
   */
  async logout() {
    try {
      const response = await this.client.request({
        method: 'POST',
        url: '/index.php/logout',
        headers: {
          'requesttoken': this.requesttoken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        validateStatus: (status) => status < 500
      });

      if (response.status >= 200 && response.status < 300) {
        return { status: 'success' };
      }
      
      return {
        status: 'error',
        data: { message: `HTTP ${response.status}` }
      };
    } catch (err) {
      return {
        status: 'error',
        data: { message: err.response?.data || err.message }
      };
    }
  }

}
module.exports = SSPSpi;
