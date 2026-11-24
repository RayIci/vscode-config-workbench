const modifiers = ['ctrl', 'alt', 'shift', 'meta'];
const modifierNames = new Map([
  ...modifiers.map((name) => [name, name]),
  ['control', 'ctrl'],
  ['option', 'alt'],
  ['cmd', 'meta'],
]);

function keyName(key) {
  return key === ' ' ? 'space' : key.toLowerCase();
}

function parseChord(chord) {
  const parts = chord.split('+');
  const key = parts.pop();
  const flags = parts.map((part) => modifierNames.get(part.toLowerCase()));
  if (!key || flags.includes(undefined) || modifierNames.has(key.toLowerCase())) {
    return undefined;
  }
  if (parts.length === 0 && /^[A-Z]$/.test(key)) {
    flags.push('shift');
  }
  return [...modifiers.filter((modifier) => flags.includes(modifier)), keyName(key)].join('+');
}

function eventChord(event) {
  const key = event.key;
  if (!key || modifierNames.has(key.toLowerCase()) || key === 'AltGraph') {
    return undefined;
  }
  const flags = modifiers.filter((modifier) => event[`${modifier}Key`]);
  return [...flags, keyName(key)].join('+');
}

export function createKeyMatcher(actions, bindings, timeout) {
  const matches = new Map();
  const prefixes = new Set();
  for (const action of actions) {
    const shortcuts = bindings?.[action];
    if (!Array.isArray(shortcuts)) {
      continue;
    }
    for (const shortcut of shortcuts) {
      if (typeof shortcut !== 'string') {
        continue;
      }
      const chords = shortcut.trim().split(/\s+/).map(parseChord);
      if (chords.includes(undefined)) {
        continue;
      }
      const sequence = chords.join(' ');
      if (!matches.has(sequence)) {
        matches.set(sequence, action);
        for (let index = 1; index < chords.length; index++) {
          prefixes.add(chords.slice(0, index).join(' '));
        }
      }
    }
  }

  let pending = '';
  let lastChord;
  let lastTime;
  function reset() {
    pending = '';
    lastChord = undefined;
    lastTime = undefined;
  }

  function find(sequence, chord, now) {
    const action = matches.get(sequence);
    if (action) {
      reset();
      return action;
    }
    if (prefixes.has(sequence)) {
      pending = sequence;
      lastChord = chord;
      lastTime = now;
      return null; // A prefix was handled and awaits its next chord.
    }
    return undefined;
  }

  return {
    reset,
    match(event, now) {
      const chord = eventChord(event);
      if (!chord) {
        return undefined;
      }
      if (pending && now - lastTime > timeout) {
        reset();
      }
      if (pending && event.repeat && chord === lastChord) {
        return null;
      }
      if (pending) {
        const result = find(`${pending} ${chord}`, chord, now);
        if (result !== undefined) {
          return result;
        }
        reset();
      }
      return find(chord, chord, now);
    },
  };
}
