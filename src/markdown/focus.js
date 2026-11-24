const { handlesResource } = require('./settings');

const previewKinds = new Set([
  'vscode.markdown.preview.editor',
  'markdown.preview',
  'mainThreadWebview-markdown.preview',
]);

function registerPreviewFocus(vscode, context, readSettings) {
  const { tabGroups } = vscode.window;
  const selectedTab = () => tabGroups.activeTabGroup.activeTab;
  let lastTab;
  let pendingTab;
  let focusTimer;

  function settingsFor(tab) {
    const resource = tab.input?.uri;
    const settings = readSettings(resource);
    return settings.autoFocus && handlesResource(settings, resource) ? settings : undefined;
  }

  function scheduleFocus() {
    clearTimeout(focusTimer);
    if (!pendingTab || !vscode.window.state.focused) {
      return;
    }

    const tab = pendingTab;
    const settings = settingsFor(tab);
    if (!settings) {
      pendingTab = undefined;
      return;
    }

    // The preview webview may still be mounting when the tab is first selected.
    focusTimer = setTimeout(() => {
      if (selectedTab() !== tab || !vscode.window.state.focused) {
        return;
      }
      pendingTab = undefined;
      if (settingsFor(tab)) {
        void vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup').then(undefined, console.error);
      }
    }, settings.focusDelayMs);
  }

  function onTabSelected() {
    const tab = selectedTab();
    if (tab === lastTab) {
      return;
    }
    lastTab = tab;
    pendingTab = previewKinds.has(tab?.input?.viewType) ? tab : undefined;
    scheduleFocus();
  }

  context.subscriptions.push(
    tabGroups.onDidChangeTabs(onTabSelected),
    tabGroups.onDidChangeTabGroups(onTabSelected),
    vscode.window.onDidChangeWindowState(({ focused }) => {
      if (focused && pendingTab === selectedTab()) {
        scheduleFocus();
      }
    }),
    { dispose: () => clearTimeout(focusTimer) },
  );
  onTabSelected();
}

module.exports = { registerPreviewFocus };
