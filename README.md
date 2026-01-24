# @restomenu/iframe-sdk-core

Universal SDK core for embedding iframe-based services (parent side).

This package provides the base infrastructure for creating SDKs that embed iframe-based widgets with modal management, messaging, and theming.

## Features

- **BaseSDK**: Abstract base class for creating SDK implementations
- **ModalManager**: Handles modal creation, styling, and animations
- **MessageBridge**: PostMessage communication between parent and iframe
- **ThemeManager**: Theme resolution and management
- **EventEmitter**: Event system for SDK events
- **Utilities**: Logging, validation, error handling, sanitization

## Installation

```bash
npm install @restomenu/iframe-sdk-core
```

## Usage

```typescript
import { BaseSDK, BaseConfig, BaseError } from '@restomenu/iframe-sdk-core';

interface MyConfig extends BaseConfig {
  // Your specific config fields
  userId: string;
}

interface MyResult {
  // Your result type
}

interface MyError extends BaseError {
  code: 'MY_ERROR' | 'ANOTHER_ERROR';
}

class MySDK extends BaseSDK<MyConfig, MyResult, MyError> {
  constructor() {
    super({
      classPrefix: 'my-sdk',
    });
  }

  buildURL(config: MyConfig): string {
    return `${config.serverUrl}/widget?userId=${config.userId}`;
  }

  handleMessage(message: IframeMessage): void {
    switch (message.type) {
      case 'APP_READY':
        this.handleAppReady();
        break;
      case 'COMPLETED':
        this.resolveOpen(message.payload as MyResult);
        break;
      case 'ERROR':
        this.rejectOpen(message.payload as MyError);
        break;
    }
  }

  getDefaultConfig(): Partial<MyConfig> {
    return {
      serverUrl: 'https://example.com',
      timeout: 30000,
    };
  }
}
```

## API

See the TypeScript types for full API documentation.

## License

MIT
