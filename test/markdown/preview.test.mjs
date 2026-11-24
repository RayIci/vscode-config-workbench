import assert from 'node:assert/strict';
import test from 'node:test';
import { createKeyMatcher } from '../../src/markdown/preview/keys.mjs';
import { installPreviewNavigation } from '../../src/markdown/preview/navigation.mjs';

test('chords, sequences, repeats, timeouts and standalone fallback', () => {
  const keys = createKeyMatcher(['line', 'page', 'top', 'bottom'], {
    line: ['j'],
    page: ['Ctrl+D'],
    top: ['g g'],
    bottom: ['G'],
  }, 100);
  assert.equal(keys.match({ key: 'd', ctrlKey: true }, 0), 'page');
  assert.equal(keys.match({ key: 'G', shiftKey: true }, 1), 'bottom');
  assert.equal(keys.match({ key: 'g' }, 2), null);
  assert.equal(keys.match({ key: 'g', repeat: true }, 3), null);
  assert.equal(keys.match({ key: 'g' }, 4), 'top');
  assert.equal(keys.match({ key: 'g' }, 5), null);
  assert.equal(keys.match({ key: 'g' }, 200), null);
  assert.equal(keys.match({ key: 'j' }, 210), 'line');
  assert.equal(keys.match({ key: 'g' }, 220), null);
  keys.reset();
  assert.equal(keys.match({ key: 'g' }, 230), null);
});

test('preview honors live settings, editable fields and VS Code tab forwarding', () => {
  const windowEvents = new Map();
  const documentEvents = new Map();
  const scrolls = [];
  let preview = {
    keyBindings: { scrollDown: ['x'], halfPageUp: ['Ctrl+u'], goToBottom: ['G'] },
    lineScrollPixels: 28,
    halfPageFraction: 0.25,
    sequenceTimeoutMs: 500,
    forwardTabKeys: true,
  };
  const window = {
    innerHeight: 800,
    performance: { now: () => 0 },
    addEventListener: (type, handler) => windowEvents.set(type, handler),
    scrollBy: (_x, y) => scrolls.push(['by', y]),
    scrollTo: (_x, y) => scrolls.push(['to', y]),
  };
  const document = {
    scrollingElement: { scrollHeight: 3400 },
    addEventListener: (type, handler) => documentEvents.set(type, handler),
    querySelector: () => ({
      dataset: { neovimWorkbenchPreview: Buffer.from(JSON.stringify(preview), 'utf8').toString('base64') },
    }),
  };
  installPreviewNavigation(window, document);
  function press(key, options) {
    const event = {
      key,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.stopped = true; },
      ...options,
    };
    documentEvents.get('keydown')(event);
    return [Boolean(event.defaultPrevented), Boolean(event.stopped)];
  }

  assert.deepEqual(press('j'), [false, false]);
  assert.deepEqual(press('x'), [true, true]);
  assert.deepEqual(press('u', { ctrlKey: true }), [true, true]);
  assert.deepEqual(press('G', { shiftKey: true }), [true, true]);
  assert.deepEqual(press('x', { target: { isContentEditable: true } }), [false, false]);
  assert.deepEqual(press('Tab'), [true, false]);
  assert.deepEqual(press('Tab', { shiftKey: true }), [true, false]);
  assert.deepEqual(press('Tab', { ctrlKey: true }), [false, false]);
  assert.deepEqual(scrolls, [['by', 28], ['by', -200], ['to', 3400]]);

  preview = { ...preview, forwardTabKeys: false, keyBindings: { scrollDown: ['j'] } };
  windowEvents.get('vscode.markdown.updateContent')();
  assert.deepEqual(press('Tab'), [false, false]);
  assert.deepEqual(press('x'), [false, false]);
  assert.deepEqual(press('j'), [true, true]);
  preview = null;
  windowEvents.get('vscode.markdown.updateContent')();
  assert.deepEqual(press('j'), [false, false]);
});
