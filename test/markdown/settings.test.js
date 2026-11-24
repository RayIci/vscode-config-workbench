const assert = require('node:assert/strict');
const test = require('node:test');
const { getMarkdownSettings, handlesResource } = require('../../src/markdown/settings');
const { addPreviewConfiguration } = require('../../src/markdown/render-preview');

function readSettings(values, expectedResource) {
  const vscode = {
    workspace: {
      getConfiguration(namespace, resource) {
        assert.equal(namespace, 'vscodeConfigWorkbench.markdown');
        assert.equal(resource, expectedResource);
        return { get: (name) => values[name] };
      },
    },
  };
  return getMarkdownSettings(vscode, expectedResource);
}

test('profile overrides merge by action, including empty arrays', () => {
  const uri = { path: '/notes.MDX' };
  const settings = readSettings({
    fileExtensions: ['mdx'],
    'preview.keyBindings': { scrollDown: ['Ctrl+e'], goToBottom: [] },
    'preview.halfPageFraction': 0.75,
    'preview.lineScrollPixels': -3,
    'preview.autoFocus': false,
  }, uri);

  assert.equal(settings.autoFocus, false);
  assert.deepEqual(settings.preview.keyBindings.scrollDown, ['Ctrl+e']);
  assert.deepEqual(settings.preview.keyBindings.scrollUp, ['k']);
  assert.deepEqual(settings.preview.keyBindings.goToBottom, []);
  assert.equal(settings.preview.halfPageFraction, 0.75);
  assert.equal(settings.preview.lineScrollPixels, 48);
  assert.equal(handlesResource(settings, uri), true);
  assert.equal(handlesResource(settings, { path: '/docs.mdx/notes.md' }), false);
  assert.equal(handlesResource(readSettings({ fileExtensions: [] }), uri), true);
  assert.equal(handlesResource(readSettings({ enabled: false }), uri), false);
});

test('the renderer passes escaped settings to the preview and uses a disabled marker for excluded files', () => {
  const md = { renderer: { render: () => '<h1>Preview</h1>' } };
  addPreviewConfiguration(md, (uri) => readSettings({
    'preview.keyBindings': { scrollDown: ['é', '\"<'] },
  }, uri));

  function renderSettings(path) {
    const html = md.renderer.render([], {}, { currentDocument: { path } });
    const marker = html.match(/^<template data-vscode-config-workbench-preview="([a-zA-Z0-9+/=]+)"><\/template><h1>Preview<\/h1>$/);
    assert.ok(marker);
    return JSON.parse(Buffer.from(marker[1], 'base64').toString('utf8'));
  }

  assert.deepEqual(renderSettings('/readme.md').keyBindings.scrollDown, ['é', '\"<']);
  assert.equal(renderSettings('/readme.txt'), null);
  assert.equal(md.renderer.render([], {}, {}), '<h1>Preview</h1>');
});
