import { createKeyMatcher } from './keys.mjs';

function readPreviewSettings(document) {
  const marker = document.querySelector('.markdown-body > template[data-vscode-config-workbench-preview]');
  if (!marker) {
    return null;
  }
  try {
    const binary = atob(marker.dataset.vscodeConfigWorkbenchPreview);
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0))));
  } catch {
    return null;
  }
}

export function installPreviewNavigation(window, document) {
  const actions = {
    scrollDown: (settings) => window.scrollBy(0, settings.lineScrollPixels),
    scrollUp: (settings) => window.scrollBy(0, -settings.lineScrollPixels),
    halfPageDown: (settings) => window.scrollBy(0, window.innerHeight * settings.halfPageFraction),
    halfPageUp: (settings) => window.scrollBy(0, -window.innerHeight * settings.halfPageFraction),
    goToTop: () => window.scrollTo(0, 0),
    goToBottom: () => window.scrollTo(0, document.scrollingElement.scrollHeight),
  };

  let settings;
  let matcher;

  function loadSettings() {
    settings = readPreviewSettings(document);
    matcher = settings && createKeyMatcher(Object.keys(actions), settings.keyBindings, settings.sequenceTimeoutMs);
  }

  loadSettings();
  window.addEventListener('vscode.markdown.updateContent', loadSettings);
  window.addEventListener('blur', () => matcher?.reset());

  document.addEventListener('keydown', (event) => {
    if (!settings || !matcher) {
      return;
    }
    const editing = event.target?.isContentEditable || event.target?.closest?.('input, textarea, select');
    if (event.defaultPrevented || event.isComposing || editing || event.getModifierState?.('AltGraph')) {
      matcher.reset();
      return;
    }

    if (settings.forwardTabKeys && event.key === 'Tab' && !event.ctrlKey && !event.altKey && !event.metaKey) {
      matcher.reset();
      // Prevent browser link traversal while still allowing VS Code to receive the key.
      event.preventDefault();
      return;
    }

    const result = matcher.match(event, window.performance.now());
    if (result === undefined) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (result) {
      actions[result](settings);
    }
  }, { capture: true });
}
