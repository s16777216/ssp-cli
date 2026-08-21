#!/usr/bin/env node

const { Command } = require("commander");
const path = require("path");

const program = new Command();

program
  .name("ssp")
  .description("CLI tool for Mailcloud SecuSharePro / ownCloud")
  .version("1.0.0");

// Load command modules
const loginCmd = require("./commands/login");
const lsCmd = require("./commands/ls");
const rmCmd = require("./commands/rm");
const uploadCmd = require("./commands/upload");
const downloadCmd = require("./commands/download");

// Register commands
loginCmd(program);
lsCmd(program);
rmCmd(program);
uploadCmd(program);
downloadCmd(program);

program.parse();