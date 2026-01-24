/**
 * E2E tests for Messaging SDK scenario
 * Tests complete user journey for messaging flow
 * 
 * Note: These are simplified E2E tests. For full browser testing,
 * consider using Playwright or Cypress.
 */

import { BaseSDK } from '../../core/BaseSDK';
import type { BaseConfig, BaseError, IframeMessage } from '../../types';

// Mock Messaging SDK
class MessagingSDK extends BaseSDK<MessagingConfig, MessagingResult, MessagingError> {
  buildURL(config: MessagingConfig): string {
    const url = new URL('/m/messaging', config.serverUrl);
    url.searchParams.set('userId', config.userId);
    url.searchParams.set('brandId', config.brandId);
    if (config.chatId) {
      url.searchParams.set('chatId', config.chatId);
    }
    return url.toString();
  }

  handleMessage(message: IframeMessage): void {
    switch (message.type) {
      case 'MESSAGING_APP_READY':
        this.handleAppReady();
        break;
      case 'MESSAGING_CHAT_OPENED':
        this.emit('chatOpened', message.payload);
        break;
      case 'MESSAGING_MESSAGE_SENT':
        this.emit('messageSent', message.payload);
        break;
      case 'MESSAGING_MESSAGE_RECEIVED':
        this.emit('messageReceived', message.payload);
        break;
      case 'MESSAGING_ERROR':
        this.rejectOpen(message.payload as MessagingError);
        break;
    }
  }

  getDefaultConfig(): Partial<MessagingConfig> {
    return {
      view: 'list',
      timeout: 30 * 60 * 1000,
    };
  }
}

interface MessagingConfig extends BaseConfig {
  userId: string;
  brandId: string;
  chatId?: string;
  view?: 'list' | 'chat';
}

interface MessagingResult {
  action: 'chat_opened' | 'message_sent' | 'chat_closed';
  chat?: Chat;
  message?: Message;
}

interface Chat {
  id: string;
  channelId: string;
  customerId: string;
  unreadCount: number;
}

interface Message {
  id: string;
  chatId: string;
  content: string;
  sender: 'user' | 'customer';
}

interface MessagingError extends BaseError {
  code: 'AUTH_ERROR' | 'CHANNEL_NOT_FOUND' | 'CHAT_NOT_FOUND';
}

describe('E2E: Messaging SDK Scenario', () => {
  let sdk: MessagingSDK;
  let chatOpenedCallback: jest.Mock;
  let messageSentCallback: jest.Mock;
  let messageReceivedCallback: jest.Mock;

  beforeEach(() => {
    sdk = new MessagingSDK({ classPrefix: 'messaging' });
    chatOpenedCallback = jest.fn();
    messageSentCallback = jest.fn();
    messageReceivedCallback = jest.fn();
    
    sdk.on('chatOpened', chatOpenedCallback);
    sdk.on('messageSent', messageSentCallback);
    sdk.on('messageReceived', messageReceivedCallback);
  });

  afterEach(() => {
    if (sdk.isOpen) {
      sdk.close();
    }
    sdk.destroy();
  });

  it('should complete full messaging flow', async () => {
    // Step 1: Open messaging widget
    const promise = sdk.open({
      userId: 'user-123',
      brandId: 'brand-456',
      serverUrl: 'https://messaging.restomenu.cc',
      view: 'list',
    });

    expect(sdk.isOpen).toBe(true);

    // Step 2: Widget sends APP_READY
      const messageBridge = (sdk as any).messageBridge as any;
      const handler = messageBridge.messageHandler;

    handler({
      source: 'iframe',
      type: 'MESSAGING_APP_READY',
      timestamp: Date.now(),
    });

    // Step 3: User opens a chat
    handler({
      source: 'iframe',
      type: 'MESSAGING_CHAT_OPENED',
      payload: {
        id: 'chat-789',
        channelId: 'channel-1',
        customerId: 'customer-123',
        unreadCount: 0,
      },
      timestamp: Date.now(),
    });

    expect(chatOpenedCallback).toHaveBeenCalled();

    // Step 4: User sends a message
    handler({
      source: 'iframe',
      type: 'MESSAGING_MESSAGE_SENT',
      payload: {
        id: 'msg-1',
        chatId: 'chat-789',
        content: 'Hello!',
        sender: 'user',
      },
      timestamp: Date.now(),
    });

    expect(messageSentCallback).toHaveBeenCalled();

    // Step 5: Receive a message
    handler({
      source: 'iframe',
      type: 'MESSAGING_MESSAGE_RECEIVED',
      payload: {
        id: 'msg-2',
        chatId: 'chat-789',
        content: 'Hi there!',
        sender: 'customer',
      },
      timestamp: Date.now(),
    });

    expect(messageReceivedCallback).toHaveBeenCalled();

    // Close manually (messaging doesn't auto-close)
    sdk.close();
    await promise.catch(() => {});
  });

  it('should handle authentication error', async () => {
    const promise = sdk.open({
      userId: 'user-123',
      brandId: 'brand-456',
      serverUrl: 'https://messaging.restomenu.cc',
    });

      const messageBridge = (sdk as any).messageBridge as any;
      const handler = messageBridge.messageHandler;

    handler({
      source: 'iframe',
      type: 'MESSAGING_ERROR',
      payload: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
      timestamp: Date.now(),
    });

    await expect(promise).rejects.toMatchObject({
      code: 'AUTH_ERROR',
      message: 'Authentication failed',
    });
  });
});
