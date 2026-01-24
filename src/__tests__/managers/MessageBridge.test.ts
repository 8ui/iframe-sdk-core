/**
 * Unit tests for MessageBridge
 */

import { MessageBridge } from '../../managers/MessageBridge';
import type { IframeMessage } from '../../types';

describe('MessageBridge', () => {
  let bridge: MessageBridge;
  let handler: jest.Mock;

  beforeEach(() => {
    handler = jest.fn();
    bridge = new MessageBridge({
      iframeSelector: '.test-iframe',
    });
    // Mock window.addEventListener
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });

  afterEach(() => {
    bridge.destroy();
  });

  describe('initialize', () => {
    it('should initialize message bridge', () => {
      bridge.initialize(handler);
      expect(window.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });

    it('should not initialize twice', () => {
      bridge.initialize(handler);
      const callCount = (window.addEventListener as jest.Mock).mock.calls.length;
      bridge.initialize(handler);
      expect(window.addEventListener).toHaveBeenCalledTimes(callCount);
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      bridge.initialize(handler);
    });

    it('should send message to iframe', () => {
      const iframe = document.createElement('iframe');
      iframe.className = 'test-iframe';
      Object.defineProperty(iframe, 'contentWindow', {
        value: {
          postMessage: jest.fn(),
        },
        writable: true,
        configurable: true,
      });
      document.body.appendChild(iframe);

      bridge.sendMessage({ type: 'SET_THEME', payload: { theme: 'dark' } });

      expect(iframe.contentWindow?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'parent',
          type: 'SET_THEME',
          payload: { theme: 'dark' },
        }),
        '*'
      );

      document.body.removeChild(iframe);
    });

    it('should handle missing iframe gracefully', () => {
      expect(() => {
        bridge.sendMessage({ type: 'SET_THEME' });
      }).not.toThrow();
    });

    it('should handle iframe without contentWindow', () => {
      const iframe = document.createElement('iframe');
      iframe.className = 'test-iframe';
      document.body.appendChild(iframe);

      expect(() => {
        bridge.sendMessage({ type: 'SET_THEME' });
      }).not.toThrow();

      document.body.removeChild(iframe);
    });
  });

  describe('message handling', () => {
    let handleMessage: (event: MessageEvent) => void;

    beforeEach(() => {
      bridge.initialize(handler);
      // Get the handler function that was registered
      const addEventListenerCall = (window.addEventListener as jest.Mock).mock
        .calls[0];
      handleMessage = addEventListenerCall[1];
    });

    it('should call handler for valid messages', () => {
      const message: IframeMessage = {
        source: 'iframe',
        type: 'APP_READY',
        timestamp: Date.now(),
      };

      handleMessage({
        data: message,
        origin: 'http://localhost',
      } as MessageEvent);

      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should ignore invalid messages', () => {
      handleMessage({
        data: { invalid: 'message' },
        origin: 'http://localhost',
      } as MessageEvent);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should ignore messages from non-allowed sources', () => {
      const message = {
        source: 'other',
        type: 'APP_READY',
        timestamp: Date.now(),
      };

      handleMessage({
        data: message,
        origin: 'http://localhost',
      } as MessageEvent);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      handler.mockImplementation(() => {
        throw new Error('Handler error');
      });

      const message: IframeMessage = {
        source: 'iframe',
        type: 'APP_READY',
        timestamp: Date.now(),
      };

      expect(() => {
        handleMessage({
          data: message,
          origin: 'http://localhost',
        } as MessageEvent);
      }).not.toThrow();
    });
  });

  describe('destroy', () => {
    it('should remove event listener on destroy', () => {
      bridge.initialize(handler);
      bridge.destroy();
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });

    it('should not throw if destroyed without initialization', () => {
      expect(() => bridge.destroy()).not.toThrow();
    });
  });
});
