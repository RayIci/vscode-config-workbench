# VS Code Configuration Workbench

A modular extension for personal configuration and workflows in the VS Code desktop app. The first module adds Vim motions and optional keyboard focus to VS Code's built-in Markdown Preview.

## Markdown preview

| Keys | Action |
| --- | --- |
| `j` / `k` | Scroll down / up |
| `Ctrl+D` / `Ctrl+U` | Move down / up half a viewport |
| `g g` / `Shift+G` | Jump to the top / bottom |

Open a Markdown file in **Markdown Preview** or use **Markdown: Open Preview to the Side**. Set workbench shortcuts, including switching tabs or opening a layout, in VS Code's Keyboard Shortcuts editor. If your VS Code keybindings use `Tab` and `Shift+Tab` to switch editor tabs, set `forwardTabKeys` to `true` to forward those keys while the preview has focus. By default they navigate links in the preview.

Set options in User Settings JSON for the current VS Code profile. For example:

```jsonc
{
  "vscodeConfigWorkbench.markdown.fileExtensions": [".md", ".markdown", ".copilotmd"],
  "vscodeConfigWorkbench.markdown.preview.keyBindings": {
    "scrollDown": ["j", "Ctrl+e"],
    "scrollUp": ["k", "Ctrl+y"],
    "goToTop": ["g g"],
    "goToBottom": ["Shift+g"]
  },
  "vscodeConfigWorkbench.markdown.preview.lineScrollPixels": 40,
  "vscodeConfigWorkbench.markdown.preview.autoFocus": true,
  "vscodeConfigWorkbench.markdown.preview.forwardTabKeys": true
}
```

The `keyBindings` object takes action names as keys and arrays of shortcuts as values. Omitted actions keep their defaults. Set an action to `[]` to unbind it. Use spaces for sequences, modifiers such as `Ctrl+g` and `Shift+g`, and named keys such as `Space`, `ArrowDown`, and `PageUp`. Avoid assigning the same sequence to two actions or binding both a sequence and its prefix.

Other settings include `enabled`, `preview.halfPageFraction`, `preview.sequenceTimeoutMs`, and `preview.focusDelayMs` under the `vscodeConfigWorkbench.markdown` namespace. Suffixes are case-insensitive and control which documents receive the motions. The built-in preview determines which documents it can render. Some standalone preview tabs expose no document URI to the extension host, so their automatic focus is governed by the module and focus switches.

The extension uses the built-in Markdown renderer and leaves editor association preferences in the user's settings. In a remote workspace, install the extension wherever VS Code runs its Markdown language features. Settings Sync synchronizes extension installation on desktop once the package is available from the Marketplace. Remote extension installation follows VS Code's remote-workspace rules.

## Development

Run `npm test` with Node.js 22 or later for the module checks. In VS Code's Run and Debug view, use **Run Extension** to try it in an Extension Development Host or **Test Markdown Integration** to test the renderer with isolated settings.

The extension host entry point is in `src/extension.js`. The Markdown module keeps configuration, renderer integration, and focus handling in `src/markdown/`. The ES modules in `src/markdown/preview/` run inside the built-in preview. Add new features in their own module and register them in the host entry point as needed.

To build a VSIX locally before a repository URL is set, run `npx @vscode/vsce package --allow-missing-repository` from the repository root. Before publishing, set the publisher and repository fields in `package.json` and add the chosen license.
