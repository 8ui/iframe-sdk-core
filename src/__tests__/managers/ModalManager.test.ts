/**
 * Unit tests for ModalManager
 */

import { ModalManager } from '../../managers/ModalManager';
import type { BaseConfig } from '../../types';

describe('ModalManager', () => {
  let manager: ModalManager;

  beforeEach(() => {
    manager = new ModalManager({ classPrefix: 'test' });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  describe('createModal', () => {
    it('should create modal with iframe', () => {
      const config: BaseConfig = {
        serverUrl: 'https://example.com',
      };

      const { modal, iframe } = manager.createModal(
        'https://example.com/widget',
        config
      );

      expect(modal).toBeTruthy();
      expect(iframe).toBeTruthy();
      expect(iframe.src).toBe('https://example.com/widget');
      expect(modal.querySelector('.test-modal-iframe')).toBe(iframe);
    });

    it('should apply custom styling', () => {
      const config: BaseConfig = {
        serverUrl: 'https://example.com',
        styling: {
          overlay: {
            backgroundColor: 'rgba(255, 0, 0, 0.5)',
          },
          modal: {
            width: '500px',
            height: '400px',
          },
        },
      };

      manager.createModal('https://example.com/widget', config);

      const styleElement = document.head.querySelector(
        'style[data-test-modal-styles]'
      );
      expect(styleElement).toBeTruthy();
      expect(styleElement?.textContent).toContain('background-color');
      expect(styleElement?.textContent).toContain('width');
    });

    it('should apply animations when enabled', (done) => {
      const config: BaseConfig = {
        serverUrl: 'https://example.com',
        animations: {
          enabled: true,
          animations: [
            {
              type: 'fade',
              duration: 300,
              easing: 'ease-in-out',
            },
          ],
        },
      };

      const { modal } = manager.createModal(
        'https://example.com/widget',
        config
      );

      // Check that initial opacity is set
      const overlay = modal as HTMLElement;
      expect(overlay.style.opacity).toBe('0');

      // After animation frame, opacity should change
      setTimeout(() => {
        // Animation should be applied
        expect(overlay.style.transition).toContain('opacity');
        done();
      }, 50);
    });

    it('should handle closeOnBackdropClick', () => {
      const onClose = jest.fn();
      manager.setOnCloseCallback(onClose);

      const config: BaseConfig = {
        serverUrl: 'https://example.com',
        modal: {
          closeOnBackdropClick: true,
          closeOnEscape: true,
        },
      };

      const { modal } = manager.createModal(
        'https://example.com/widget',
        config
      );

      const overlay = modal as HTMLElement;
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });

      // Simulate click on overlay (not modal content)
      Object.defineProperty(clickEvent, 'target', {
        value: overlay,
        writable: false,
      });

      overlay.dispatchEvent(clickEvent);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('closeModal', () => {
    it('should close modal and remove from DOM', () => {
      const config: BaseConfig = {
        serverUrl: 'https://example.com',
      };

      const { modal } = manager.createModal(
        'https://example.com/widget',
        config
      );

      expect(document.body.contains(modal)).toBe(true);

      manager.closeModal(modal, config);

      // Modal should be removed after close
      setTimeout(() => {
        expect(document.body.contains(modal)).toBe(false);
      }, 100);
    });

    it('should call onClose callback', () => {
      const onClose = jest.fn();
      manager.setOnCloseCallback(onClose);

      const config: BaseConfig = {
        serverUrl: 'https://example.com',
      };

      const { modal } = manager.createModal(
        'https://example.com/widget',
        config
      );

      manager.closeModal(modal, config);

      expect(onClose).toHaveBeenCalled();
    });

    it('should handle close animations', (done) => {
      const config: BaseConfig = {
        serverUrl: 'https://example.com',
        animations: {
          enabled: true,
          animations: [
            {
              type: 'fade',
              duration: 100,
            },
          ],
        },
      };

      const { modal } = manager.createModal(
        'https://example.com/widget',
        config
      );

      manager.closeModal(modal, config);

      // Modal should be removed after animation duration
      setTimeout(() => {
        expect(document.body.contains(modal)).toBe(false);
        done();
      }, 150);
    });
  });

  describe('getIframeSelector', () => {
    it('should return correct iframe selector', () => {
      expect(manager.getIframeSelector()).toBe('.test-modal-iframe');
    });
  });
});
