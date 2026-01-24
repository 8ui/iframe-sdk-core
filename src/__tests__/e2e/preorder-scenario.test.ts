/**
 * E2E tests for Preorder SDK scenario
 * Tests complete user journey for preorder flow
 * 
 * Note: These are simplified E2E tests. For full browser testing,
 * consider using Playwright or Cypress.
 */

import { BaseSDK } from '../../core/BaseSDK';
import type { BaseConfig, BaseError, IframeMessage } from '../../types';

// Mock Preorder SDK
class PreorderSDK extends BaseSDK<PreorderConfig, Order, PreorderError> {
  buildURL(config: PreorderConfig): string {
    const url = new URL('/m/preorder', config.serverUrl);
    url.searchParams.set('pointId', config.pointId);
    if (config.orderId) {
      url.searchParams.set('orderId', config.orderId);
    }
    return url.toString();
  }

  handleMessage(message: IframeMessage): void {
    switch (message.type) {
      case 'PREORDER_APP_READY':
        this.handleAppReady();
        break;
      case 'PREORDER_COMPLETED':
        this.resolveOpen(message.payload as Order);
        break;
      case 'PREORDER_UPDATED':
        this.emit('orderUpdated', message.payload);
        break;
      case 'PREORDER_ERROR':
        this.rejectOpen(message.payload as PreorderError);
        break;
    }
  }

  getDefaultConfig(): Partial<PreorderConfig> {
    return {
      serverUrl: 'https://external-menu.dev.restomenu.cc',
      timeout: 24 * 60 * 60 * 1000,
    };
  }
}

interface PreorderConfig extends BaseConfig {
  pointId: string;
  orderId?: string;
}

interface Order {
  orderId: string;
  pointId: string;
  items: Array<{ id: string; quantity: number }>;
  total: number;
}

interface PreorderError extends BaseError {
  code: 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'USER_CANCELLED';
}

describe('E2E: Preorder SDK Scenario', () => {
  let sdk: PreorderSDK;
  let orderUpdatedCallback: jest.Mock;

  beforeEach(() => {
    sdk = new PreorderSDK({ classPrefix: 'preorder' });
    orderUpdatedCallback = jest.fn();
    sdk.on('orderUpdated', orderUpdatedCallback);
  });

  afterEach(() => {
    if (sdk.isOpen) {
      sdk.close();
    }
    sdk.destroy();
  });

  it('should complete full preorder flow', async () => {
    // Step 1: Open preorder modal
    const promise = sdk.open({
      pointId: 'point-123',
      serverUrl: 'https://external-menu.dev.restomenu.cc',
    });

    expect(sdk.isOpen).toBe(true);

    // Step 2: Widget sends APP_READY
      const messageBridge = (sdk as any).messageBridge as any;
      const handler = messageBridge.messageHandler;

    handler({
      source: 'iframe',
      type: 'PREORDER_APP_READY',
      timestamp: Date.now(),
    });

    // Step 3: Widget sends order update
    handler({
      source: 'iframe',
      type: 'PREORDER_UPDATED',
      payload: {
        orderId: 'order-456',
        pointId: 'point-123',
        items: [{ id: 'item-1', quantity: 2 }],
        total: 100,
      },
      timestamp: Date.now(),
    });

    expect(orderUpdatedCallback).toHaveBeenCalled();

    // Step 4: Widget sends completion
    handler({
      source: 'iframe',
      type: 'PREORDER_COMPLETED',
      payload: {
        orderId: 'order-456',
        pointId: 'point-123',
        items: [{ id: 'item-1', quantity: 2 }],
        total: 100,
      },
      timestamp: Date.now(),
    });

    // Step 5: Verify result
    const result = await promise;
    expect(result).toMatchObject({
      orderId: 'order-456',
      pointId: 'point-123',
      total: 100,
    });
    expect(sdk.isOpen).toBe(false);
  });

  it('should handle user cancellation', async () => {
    const promise = sdk.open({
      pointId: 'point-123',
      serverUrl: 'https://external-menu.dev.restomenu.cc',
    });

    // User closes modal
    sdk.close();

    await expect(promise).rejects.toMatchObject({
      code: 'USER_CANCELLED',
    });
  });

  it('should handle error from widget', async () => {
    const promise = sdk.open({
      pointId: 'point-123',
      serverUrl: 'https://external-menu.dev.restomenu.cc',
    });

      const messageBridge = (sdk as any).messageBridge as any;
      const handler = messageBridge.messageHandler;

    handler({
      source: 'iframe',
      type: 'PREORDER_ERROR',
      payload: {
        code: 'NETWORK_ERROR',
        message: 'Network error occurred',
      },
      timestamp: Date.now(),
    });

    await expect(promise).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: 'Network error occurred',
    });
  });
});
