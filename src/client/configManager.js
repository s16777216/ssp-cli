const fs = require('fs');
const path = require('path');
const os = require('os');

class ConfigManager {
  constructor() {
    this.configPath = path.join(os.homedir(), '.ssp-config.json');
  }

  load() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (err) {
      // ignore
    }
    return {};
  }

  save(config) {
    try {
      const current = this.load();
      const updated = { ...current, ...config };
      fs.writeFileSync(this.configPath, JSON.stringify(updated, null, 2), 'utf8');
    } catch (err) {
      throw new Error(`Failed to save config: ${err.message}`);
    }
  }

  get(key) {
    const config = this.load();
    return config[key];
  }

  clear() {
    try {
      if (fs.existsSync(this.configPath)) {
        fs.unlinkSync(this.configPath);
      }
    } catch (err) {
      throw new Error(`Failed to clear config: ${err.message}`);
    }
  }
}

module.exports = new ConfigManager();
