const assert = require('node:assert/strict');
const vscode = require('vscode');

async function run() {
  const markdown = vscode.extensions.getExtension('vscode.markdown-language-features');
  await markdown.activate();
  const config = vscode.workspace.getConfiguration('vscodeConfigWorkbench.markdown');
  const document = await vscode.workspace.openTextDocument(
    vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'preview.md'),
  );

  async function previewSettings() {
    const html = await vscode.commands.executeCommand('markdown.api.render', document);
    const marker = html.match(/^<template data-vscode-config-workbench-preview="([a-zA-Z0-9+/=]+)"><\/template>/);
    assert.ok(marker, 'The VS Code renderer must load the settings contribution');
    assert.ok(html.includes('Preview fixture'), 'The Markdown rendered content must remain present');
    return JSON.parse(Buffer.from(marker[1], 'base64').toString('utf8'));
  }

  const defaults = await previewSettings();
  assert.deepEqual(defaults.keyBindings.goToTop, ['g g']);
  assert.deepEqual(defaults.keyBindings.scrollDown, ['j']);
  const changes = {
    'preview.keyBindings': { scrollDown: ['Ctrl+e'], goToTop: [] },
    'preview.lineScrollPixels': 25,
    fileExtensions: ['.markdown'],
  };
  const previous = Object.keys(changes).map((key) => [key, config.inspect(key)?.globalValue]);
  const update = (key, value) => config.update(key, value, vscode.ConfigurationTarget.Global);
  try {
    await update('preview.keyBindings', changes['preview.keyBindings']);
    await update('preview.lineScrollPixels', changes['preview.lineScrollPixels']);
    const custom = await previewSettings();
    assert.deepEqual(custom.keyBindings.scrollDown, ['Ctrl+e']);
    assert.deepEqual(custom.keyBindings.scrollUp, ['k']);
    assert.deepEqual(custom.keyBindings.goToTop, []);
    assert.equal(custom.lineScrollPixels, 25);

    await update('fileExtensions', changes.fileExtensions);
    assert.equal(await previewSettings(), null);
  } finally {
    for (const [key, value] of previous) {
      await update(key, value);
    }
  }
  console.log('VS Code Configuration Workbench Markdown renderer integration passed.');
}

module.exports = { run };
