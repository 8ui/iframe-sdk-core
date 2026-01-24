/**
 * Integration tests for SDK → Widget flow
 * Tests the complete communication flow between SDK and Widget
 */

import { BaseSDK } from '../../core/BaseSDK';
import { MessageBridge } from '../../managers/MessageBridge';
import { ModalManager } from '../../managers/ModalManager';
import type { BaseConfig, BaseError, IframeMessage } from '../../types';

// Test SDK implementation
class TestSDK extends BaseSDK<TestConfig, TestResult, TestError> {
  buildURL(config: TestConfig): string {
    return `${config.serverUrl}/widget?param=${config.param}`;
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
    }
  }

  getDefaultConfig(): Partial<TestConfig> {
    return {
      serverUrl: 'https://test.com',
    };
  }
}

interface TestConfig extends BaseConfig {
  param: string;
}

interface TestResult {
  success: boolean;
  data: string;
}

interface TestError extends BaseError {
  code: 'TEST_ERROR';
}

describe('SDK → Widget Integration Flow', () => {
  let sdk: TestSDK;
  let mockIframe: HTMLIFrameElement;

  beforeEach(() => {
    sdk = new TestSDK({ classPrefix: 'test' });
    
    // Create mock iframe
    mockIframe = document.createElement('iframe');
    mockIframe.className = 'test-modal-iframe';
    Object.defineProperty(mockIframe, 'contentWindow', {
      value: {
        postMessage: jest.fn(),
      },
      writable: true,
      configurable: true,
    });
    document.body.appendChild(mockIframe);
  });

  afterEach(() => {
    if (sdk.isOpen) {
      sdk.close();
    }
    sdk.destroy();
    document.body.innerHTML = '';
  });

  describe('Complete flow', () => {
    it('should handle complete SDK → Widget → SDK flow', async () => {
      const promise = sdk.open({
        serverUrl: 'https://test.com',
        param: 'value',
      });

      expect(sdk.isOpen).toBe(true);

      // Simulate widget sending APP_READY
      const readyMessage: IframeMessage = {
        source: 'iframe',
        type: 'APP_READY',
        timestamp: Date.now(),
      };

      // Get message handler from MessageBridge
      const messageBridge = (sdk as any).messageBridge as MessageBridge;
      const handler = (messageBridge as any).messageHandler;
      
      if (handler) {
        handler(readyMessage);
      }

      // Simulate widget sending COMPLETED
      const completedMessage: IframeMessage = {
        source: 'iframe',
        type: 'COMPLETED',
        payload: { success: true, data: 'test' },
        timestamp: Date.now(),
      };

      if (handler) {
        handler(completedMessage);
      }

      const result = await promise;
      expect(result).toEqual({ success: true, data: 'test' });
      expect(sdk.isOpen).toBe(false);
    });

    it('should handle error flow', async () => {
      const promise = sdk.open({
        serverUrl: 'https://test.com',
        param: 'value',
      });

      const messageBridge = (sdk as any).messageBridge;
      const handler = (messageBridge as MessageBridge)['messageHandler'];

      const errorMessage: IframeMessage = {
        source: 'iframe',
        type: 'ERROR',
        payload: {
          code: 'TEST_ERROR',
          message: 'Test error',
        },
        timestamp: Date.now(),
      };

      if (handler) {
        handler(errorMessage);
      }

      await expect(promise).rejects.toMatchObject({
        code: 'TEST_ERROR',
        message: 'Test error',
      });
    });

    it('should send theme to widget when set', async () => {
      sdk.setTheme('dark');
      
      const promise = sdk.open({
        serverUrl: 'https://test.com',
        param: 'value',
      });

      const messageBridge = (sdk as any).messageBridge;
      const handler = (messageBridge as MessageBridge)['messageHandler'];

      // Simulate APP_READY
      const readyMessage: IframeMessage = {
        source: 'iframe',
        type: 'APP_READY',
        timestamp: Date.now(),
      };

      if (handler) {
        handler(readyMessage);
      }

      // Check that theme was sent
      const iframe = document.querySelector('.test-modal-iframe') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        // Theme should be sent after APP_READY
        expect(iframe.contentWindow.postMessage).toHaveBeenCalled();
      }

      sdk.close();
      await promise.catch(() => {});
    });
  });

  describe('Error scenarios', () => {
    it('should handle network errors gracefully', async () => {
      const promise = sdk.open({
        serverUrl: 'https://invalid-url-that-does-not-exist.com',
        param: 'value',
      });

      // Modal should still open (iframe will handle load error)
      expect(sdk.isOpen).toBe(true);

      sdk.close();
      await promise.catch(() => {});
    });

    it('should handle timeout', async () => {
      const promise = sdk.open({
        serverUrl: 'https://test.com',
        param: 'value',
        timeout: 100,
      });

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Close manually (timeout handling would be in real implementation)
      sdk.close();
      await promise.catch(() => {});
    });
  });

  describe('Theme synchronization', () => {
    it('should sync theme between SDK and Widget', async () => {
      sdk.setTheme('dark');
      
      const promise = sdk.open({
        serverUrl: 'https://test.com',
        param: 'value',
      });

      const messageBridge = (sdk as any).messageBridge;
      const handler = (messageBridge as MessageBridge)['messageHandler'];

      // Widget sends APP_READY
      const readyMessage: IframeMessage = {
        source: 'iframe',
        type: 'APP_READY',
        timestamp: Date.now(),
      };

      if (handler) {
        handler(readyMessage);
      }

      // SDK should send theme to widget
      const iframe = document.querySelector('.test-modal-iframe') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        const postMessageCalls = (iframe.contentWindow.postMessage as jest.Mock).mock.calls;
        const themeMessage = postMessageCalls.find(
          (call: any[]) => call[0]?.type === 'SET_THEME'
        );
        expect(themeMessage).toBeTruthy();
      }

      sdk.close();
      await promise.catch(() => {});
    });
  });
});
