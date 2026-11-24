# Repository instructions

- Keep this a general-purpose extension for personal VS Code configuration and workflows. Support Neovim-style features alongside other custom tools. Add features as independent modules, with Markdown as the first module.
- Expose behavior that users may want to change as documented VS Code settings with reasonable defaults. Support Default and named-profile settings. Changing a binding, supported Markdown suffix, or feature option should require only a settings edit.
- Put bindings handled inside a rendered preview in the extension's settings. Use VS Code's standard keybinding mechanism for workbench commands so users can override them in `keybindings.json`.
- Keep Markdown editor associations in user or profile settings so they can sync independently of the extension. Preserve users' choices of editor and previewer.
- Keep configuration and module code portable across PCs. Do not commit personal settings, absolute machine paths, credentials, or Marketplace tokens. Use the Marketplace for cross-PC installation through Settings Sync.
- Keep host code, preview code, and tests organized by feature. Reuse existing logic, prefer simple modules, and add tests for settings overrides and behavior that could regress.
- Leave the user's Neovim Lua configuration and existing VS Code settings alone unless the task specifically asks to edit them.
- Obtain approval for the repository owner, public visibility, license, and Marketplace publisher before publishing.
