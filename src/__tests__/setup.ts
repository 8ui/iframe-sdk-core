// Jest setup for iframe-sdk-core tests

// Define __DEBUG__ global variable for tests
(global as any).__DEBUG__ = true;

// Mock window.postMessage
global.postMessage = jest.fn();

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb: FrameRequestCallback) => {
  return setTimeout(cb, 16);
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Clear DOM before each test
beforeEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  jest.clearAllMocks();
});

// Suppress console logs in tests unless DEBUG is set
if (process.env.DEBUG !== 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
