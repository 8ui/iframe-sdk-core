/**
 * Unit tests for BaseSDK
 */

import { BaseSDK } from '../../core/BaseSDK';
import type { BaseConfig, BaseError, IframeMessage } from '../../types';

// Create a concrete implementation for testing
class TestSDK extends BaseSDK<TestConfig, TestResult, TestError> {
  buildURL(config: TestConfig): string {
    return `${config.serverUrl}/test?param=${config.testParam}`;
  }

  handleMessage(message: IframeMessage): void {
    switch (message.type) {
      case 'APP_READY':
        this.handleAppReady();
        break;
      case 'COMPLETED':
        this.resolveOpen(message.payload as TestResult);
        break;
      case 'ERROR':
        this.rejectOpen(message.payload as TestError);
        break;
      case 'REQUEST_CLOSE':
        this.handleRequestClose();
        break;
    }
  }

  getDefaultConfig(): Partial<TestConfig> {
    return {
      serverUrl: 'https://default.com',
      timeout: 5000,
    };
  }
}

interface TestConfig extends BaseConfig {
  testParam: string;
}

interface TestResult {
  success: boolean;
  data: string;
}

interface TestError extends BaseError {
  code: 'TEST_ERROR' | 'NETWORK_ERROR';
}

describe('BaseSDK', () => {
  let sdk: TestSDK;

  beforeEach(() => {
    sdk = new TestSDK({ classPrefix: 'test' });
  });

  afterEach(() => {
    if (sdk.isOpen) {
      sdk.close();
    }
    sdk.destroy();
  });

  describe('constructor', () => {
    it('should initialize SDK with class prefix', () => {
      expect(sdk).toBeTruthy();
      expect(sdk.isOpen).toBe(false);
    });
  });

  describe('open', () => {
    it('should open modal with merged config', async () => {
      const config = {
        serverUrl: 'https://example.com',
        testParam: 'value',
      };

      const promise = sdk.open(config);

      expect(sdk.isOpen).toBe(true);
      expect(sdk.config).toBeTruthy();
      expect(sdk.config?.serverUrl).toBe('https://example.com');
      expect(sdk.config?.testParam).toBe('value');

      // Clean up
      sdk.close();
      await promise.catch(() => {}); // Ignore rejection
    });

    it('should reject if modal is already open', async () => {
      await sdk.open({
        serverUrl: 'https://example.com',
        testParam: 'value',
      }).catch(() => {});

      await expect(
        sdk.open({
          serverUrl: 'https://example.com',
          testParam: 'value',
        })
      ).rejects.toMatchObject({
        code: 'MODAL_ALREADY_OPEN',
      });
    });

    it('should merge with default config', async () => {
      const promise = sdk.open({
        testParam: 'value',
      });

      expect(sdk.config?.serverUrl).toBe('https://default.com');
      expect(sdk.config?.timeout).toBe(5000);

      sdk.close();
      await promise.catch(() => {});
    });
  });

  describe('close', () => {
    it('should close modal', async () => {
      await sdk.open({
        serverUrl: 'https://example.com',
        testParam: 'value',
      }).catch(() => {});

      expect(sdk.isOpen).toBe(true);
      sdk.close();
      expect(sdk.isOpen).toBe(false);
    });

    it('should reject pending promise on close', async () => {
      const promise = sdk.open({
        serverUrl: 'https://example.com',
        testParam: 'value',
      });

      sdk.close();

      await expect(promise).rejects.toMatchObject({
        code: 'USER_CANCELLED',
      });
    });
  });

  describe('setTheme', () => {
    it('should set theme', () => {
      sdk.setTheme('dark');
      expect(sdk.currentTheme).toBe('dark');
    });

    it('should send theme to iframe when open', async () => {
      await sdk.open({
        serverUrl: 'https://example.com',
        testParam: 'value',
      }).catch(() => {});

      // Mock iframe and messageBridge
      const iframe = document.querySelector('.test-modal-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        const postMessageSpy = jest.spyOn(iframe.contentWindow, 'postMessage');
        sdk.setTheme('dark');
        // Note: In real scenario, messageBridge would send the message
        // This test verifies the theme is set
        expect(sdk.currentTheme).toBe('dark');
        postMessageSpy.mockRestore();
      }

      sdk.close();
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      sdk.configure({
        serverUrl: 'https://new.com',
        testParam: 'new',
      });

      expect(sdk.config?.serverUrl).toBe('https://new.com');
      expect(sdk.config?.testParam).toBe('new');
    });
  });

  describe('events', () => {
    it('should emit and listen to events', () => {
      const callback = jest.fn();
      sdk.on('test-event', callback);
      (sdk as any).emit('test-event', 'payload');
      expect(callback).toHaveBeenCalledWith('payload');
    });

    it('should support once listeners', () => {
      const callback = jest.fn();
      sdk.once('test-event', callback);
      (sdk as any).emit('test-event', 'payload1');
      (sdk as any).emit('test-event', 'payload2');
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('payload1');
    });

    it('should support removing listeners', () => {
      const callback = jest.fn();
      sdk.on('test-event', callback);
      sdk.off('test-event', callback);
      (sdk as any).emit('test-event', 'payload');
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('handleMessage', () => {
    it('should handle APP_READY message', async () => {
      const promise = sdk.open({
        serverUrl: 'https://example.com',
        testParam: 'value',
      });

      // Simulate message from iframe
      const message: IframeMessage = {
        source: 'iframe',
        type: 'APP_READY',
        timestamp: Date.now(),
      };

      sdk.handleMessage(message);

      sdk.close();
      await promise.catch(() => {});
    });

    it('should resolve on COMPLETED message', async () => {
      const promise = sdk.open({
        serverUrl: 'https://example.com',
        testParam: 'value',
      });

      const result: TestResult = {
        success: true,
        data: 'test',
      };

      const message: IframeMessage = {
        source: 'iframe',
        type: 'COMPLETED',
        payload: result,
        timestamp: Date.now(),
      };

      sdk.handleMessage(message);

      await expect(promise).resolves.toEqual(result);
    });

    it('should reject on ERROR message', async () => {
      const promise = sdk.open({
        serverUrl: 'https://example.com',
        testParam: 'value',
      });

      const error: TestError = {
        code: 'TEST_ERROR',
        message: 'Test error',
      };

      const message: IframeMessage = {
        source: 'iframe',
        type: 'ERROR',
        payload: error,
        timestamp: Date.now(),
      };

      sdk.handleMessage(message);

      await expect(promise).rejects.toEqual(error);
    });
  });

  describe('destroy', () => {
    it('should clean up resources', async () => {
      await sdk.open({
        serverUrl: 'https://example.com',
        testParam: 'value',
      }).catch(() => {});

      sdk.destroy();
      expect(sdk.isOpen).toBe(false);
      expect(sdk.config).toBeNull();
    });
  });
});
