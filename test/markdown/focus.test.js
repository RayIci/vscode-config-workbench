const assert = require('node:assert/strict');
const test = require('node:test');
const { registerPreviewFocus } = require('../../src/markdown/focus');

test('focus applies only to the selected eligible preview and respects profile options', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const tabEvents = new Map();
  const calls = [];
  const preview = { input: { viewType: 'vscode.markdown.preview.editor', uri: { path: '/notes.md' } } };
  const excluded = { input: { viewType: 'vscode.markdown.preview.editor', uri: { path: '/notes.mdx' } } };
  const source = { input: undefined };
  const settings = { enabled: true, fileExtensions: ['.md'], autoFocus: true, focusDelayMs: 80 };
  const group = { activeTab: source };
  const state = { focused: true };
  const vscode = {
    window: {
      state,
      tabGroups: {
        activeTabGroup: group,
        onDidChangeTabs: (handler) => tabEvents.set('tabs', handler),
        onDidChangeTabGroups: (handler) => tabEvents.set('groups', handler),
      },
      onDidChangeWindowState: (handler) => tabEvents.set('window', handler),
    },
    commands: {
      async executeCommand(command) { calls.push(command); },
    },
  };
  const context = { subscriptions: [] };
  registerPreviewFocus(vscode, context, () => settings);
  const select = (tab) => {
    group.activeTab = tab;
    tabEvents.get('tabs')();
  };

  select(preview);
  select(source);
  t.mock.timers.tick(80);
  select(excluded);
  t.mock.timers.tick(80);
  assert.deepEqual(calls, []);

  state.focused = false;
  select(preview);
  t.mock.timers.tick(80);
  state.focused = true;
  tabEvents.get('window')(state);
  t.mock.timers.tick(79);
  assert.deepEqual(calls, []);
  t.mock.timers.tick(1);
  assert.deepEqual(calls, ['workbench.action.focusActiveEditorGroup']);

  settings.autoFocus = false;
  select(source);
  select(preview);
  t.mock.timers.tick(80);
  assert.equal(calls.length, 1);
});
