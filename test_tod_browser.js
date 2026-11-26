const fs = require('fs');

// Mock browser DOM
global.window = global;
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  getElementById: (id) => {
    return {
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      style: {},
      addEventListener: () => {},
      querySelectorAll: () => [],
      querySelector: () => null
    };
  },
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: () => ({ style: {}, appendChild: () => {}, select: () => {} }),
  body: { appendChild: () => {}, removeChild: () => {} }
};
global.navigator = { vibrate: () => {} };
global.URLSearchParams = class { get() { return null; } };

try {
  require('./js/truth-or-dare-data.js');
  console.log('truth-or-dare-data loaded successfully!');
  require('./js/truth-or-dare-game.js');
  console.log('truth-or-dare-game loaded successfully!');
  
  // Test methods
  window.TruthOrDareGame.init();
  console.log('TruthOrDareGame.init() OK');
  window.TruthOrDareGame.openGame('sweet');
  console.log('TruthOrDareGame.openGame() OK');
  window.TruthOrDareGame.closeGameModal();
  console.log('TruthOrDareGame.closeGameModal() OK');
} catch (e) {
  console.error('Simulation ERROR:', e);
}
