// Shared utilities for commands
const Table = require("cli-table3");

// ANSI Color Detection & Codes
const isColorSupported = () => {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR) return true;
  if (!process.stdout.isTTY) return false;
  if (process.platform === "win32") return true;
  return process.env.TERM !== "dumb";
};

const useColor = isColorSupported();

const c = {
  dir: useColor ? "\x1b[1;34m" : "",
  file: useColor ? "\x1b[0m" : "",
  dim: useColor ? "\x1b[2m" : "",
  bold: useColor ? "\x1b[1m" : "",
  reset: useColor ? "\x1b[0m" : "",
};

// Permission Decoder
const decodePermissions = (perm) => {
  if (typeof perm === "string") return perm;
  if (typeof perm !== "number") return "";

  const bits = [
    ["R", 1],
    ["W", 2],
    ["D", 4],
    ["C", 8],
    ["K", 16],
    ["S", 32],
  ];

  return bits.map(([label, bit]) => (perm & bit ? label : "-")).join("");
};

// Get effective permissions: sharePermissions > permissions
// But external storage mount points (shared-root) don't allow deletion even if D bit is set
const getEffectivePerm = (file) => {
  let perm = file.permissions;
  if (file.sharePermissions !== undefined && file.sharePermissions !== null) {
    perm = file.sharePermissions;
  }
  // External storage mount points don't allow deletion regardless of permissions
  if (file.isShareMountPoint && file.mountType === "shared-root") {
    perm = perm & ~4; // Clear bit 4 (D)
  }
  return perm;
};

// Get owner display name
const getOwner = (file) => {
  if (file.displayOwner) return file.displayOwner;
  if (file.shareOwner) return file.shareOwner;
  return "";
};

// Create configured table instance
const createTable = (options) => {
  const showAll = options.all;
  const showSize = showAll || options.size;
  const showDate = showAll || options.date;
  const showPerm = showAll || options.perm;
  const showOwner = showAll || options.owner;

  return new Table({
    head: [
      "Name",
      ...(showSize ? ["Size"] : []),
      ...(showDate ? ["Date"] : []),
      ...(showPerm ? ["Perm"] : []),
      ...(showOwner ? ["Owner"] : []),
    ],
    chars: {
      top: "",
      "top-mid": "",
      "top-left": "",
      "top-right": "",
      bottom: "",
      "bottom-mid": "",
      "bottom-left": "",
      "bottom-right": "",
      left: "",
      "left-mid": "",
      mid: "",
      "mid-mid": "",
      right: "",
      "right-mid": "",
      middle: " ",
    },
    style: { "padding-left": 0, "padding-right": 0 },
    colAligns: [
      "left",
      ...(showSize ? ["right"] : []),
      ...(showDate ? ["center"] : []),
      ...(showPerm ? ["center"] : []),
      ...(showOwner ? ["left"] : []),
    ],
  });
};

module.exports = {
  c,
  decodePermissions,
  getEffectivePerm,
  getOwner,
  createTable,
};