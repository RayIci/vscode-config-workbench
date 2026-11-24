const { registerPreviewFocus } = require('./focus');
const { addPreviewConfiguration } = require('./render-preview');
const { getMarkdownSettings, namespace } = require('./settings');

function activateMarkdown(vscode, context) {
  const readSettings = (resource) => getMarkdownSettings(vscode, resource);
  registerPreviewFocus(vscode, context, readSettings);

  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration(namespace) && vscode.extensions.getExtension('vscode.markdown-language-features')?.isActive) {
      void vscode.commands.executeCommand('markdown.preview.refresh').then(undefined, console.error);
    }
  }));

  return {
    extendMarkdownIt(markdownIt) {
      return addPreviewConfiguration(markdownIt, readSettings);
    },
  };
}

module.exports = { activateMarkdown };
