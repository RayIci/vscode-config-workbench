const vscode = require('vscode');
const { activateMarkdown } = require('./markdown');

function activate(context) {
  return activateMarkdown(vscode, context);
}

module.exports = { activate };
