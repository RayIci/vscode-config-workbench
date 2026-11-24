const { handlesResource } = require('./settings');

function addPreviewConfiguration(markdownIt, readSettings) {
  const renderer = markdownIt.renderer;
  const render = renderer.render;

  renderer.render = function (tokens, options, env) {
    const html = render.call(this, tokens, options, env);
    const resource = env?.currentDocument;
    if (!resource) {
      return html;
    }

    const settings = readSettings(resource);
    // Encode configuration as inert metadata. It contains no commands or executable code.
    const preview = handlesResource(settings, resource) ? settings.preview : null;
    const encoded = Buffer.from(JSON.stringify(preview), 'utf8').toString('base64');
    return `<template data-neovim-workbench-preview="${encoded}"></template>${html}`;
  };

  return markdownIt;
}

module.exports = { addPreviewConfiguration };
