const { contributes } = require('../../package.json');

const namespace = 'neovimWorkbench.markdown';
const settingSchema = contributes.configuration.properties;

function getMarkdownSettings(vscode, resource) {
  const config = vscode.workspace.getConfiguration(namespace, resource);
  const read = (name) => {
    const definition = settingSchema[`${namespace}.${name}`];
    const value = config.get(name);
    switch (definition.type) {
      case 'boolean':
        return typeof value === 'boolean' ? value : definition.default;
      case 'array':
        return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : definition.default;
      case 'object':
        return value && typeof value === 'object' && !Array.isArray(value) ? value : definition.default;
      case 'integer':
      case 'number': {
        const valid = Number.isFinite(value) &&
          (definition.type !== 'integer' || Number.isInteger(value)) &&
          value >= (definition.minimum ?? -Infinity) &&
          value <= (definition.maximum ?? Infinity);
        return valid ? value : definition.default;
      }
    }
  };
  const previewBindings = read('preview.keyBindings');

  return {
    enabled: read('enabled'),
    fileExtensions: read('fileExtensions'),
    autoFocus: read('preview.autoFocus'),
    focusDelayMs: read('preview.focusDelayMs'),
    preview: {
      keyBindings: {
        ...settingSchema[`${namespace}.preview.keyBindings`].default,
        ...previewBindings,
      },
      lineScrollPixels: read('preview.lineScrollPixels'),
      halfPageFraction: read('preview.halfPageFraction'),
      sequenceTimeoutMs: read('preview.sequenceTimeoutMs'),
      forwardTabKeys: read('preview.forwardTabKeys'),
    },
  };
}

function handlesResource(settings, resource) {
  if (!settings.enabled) {
    return false;
  }
  if (!resource || settings.fileExtensions.length === 0) {
    return true;
  }

  const filename = resource.path.split('/').at(-1).toLowerCase();
  return settings.fileExtensions.some((extension) => {
    const suffix = extension.trim().toLowerCase();
    return suffix && filename.endsWith(suffix.startsWith('.') ? suffix : `.${suffix}`);
  });
}

module.exports = { getMarkdownSettings, handlesResource, namespace };
