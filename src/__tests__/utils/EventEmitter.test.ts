/**
 * Unit tests for EventEmitter
 */

import { EventEmitter } from '../../utils/EventEmitter';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('on', () => {
    it('should subscribe to an event', () => {
      const callback = jest.fn();
      emitter.on('test', callback);
      emitter.emit('test', 'payload');
      expect(callback).toHaveBeenCalledWith('payload');
    });

    it('should support multiple listeners for the same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      emitter.on('test', callback1);
      emitter.on('test', callback2);
      emitter.emit('test', 'payload');
      expect(callback1).toHaveBeenCalledWith('payload');
      expect(callback2).toHaveBeenCalledWith('payload');
    });

    it('should support wildcard listeners', () => {
      const callback = jest.fn();
      emitter.on('*', callback);
      emitter.emit('test', 'payload');
      expect(callback).toHaveBeenCalledWith('test', 'payload');
    });

    it('should not subscribe if callback is not a function', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();
      emitter.on('test', null as any);
      emitter.emit('test', 'payload');
      expect(console.warn).toHaveBeenCalled();
      console.warn = originalWarn;
    });
  });

  describe('off', () => {
    it('should unsubscribe from an event', () => {
      const callback = jest.fn();
      emitter.on('test', callback);
      emitter.off('test', callback);
      emitter.emit('test', 'payload');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle unsubscribing non-existent listener', () => {
      const callback = jest.fn();
      emitter.off('test', callback);
      // Should not throw
      expect(() => emitter.off('test', callback)).not.toThrow();
    });
  });

  describe('once', () => {
    it('should call listener only once', () => {
      const callback = jest.fn();
      emitter.once('test', callback);
      emitter.emit('test', 'payload1');
      emitter.emit('test', 'payload2');
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('payload1');
    });

    it('should support wildcard once listeners', () => {
      const callback = jest.fn();
      emitter.once('*', callback);
      emitter.emit('test1', 'payload1');
      emitter.emit('test2', 'payload2');
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('test1', 'payload1');
    });
  });

  describe('emit', () => {
    it('should emit event to all listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      emitter.on('test', callback1);
      emitter.on('test', callback2);
      emitter.emit('test', 'payload');
      expect(callback1).toHaveBeenCalledWith('payload');
      expect(callback2).toHaveBeenCalledWith('payload');
    });

    it('should handle errors in listeners gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = jest.fn();
      emitter.on('test', errorCallback);
      emitter.on('test', normalCallback);
      expect(() => emitter.emit('test', 'payload')).not.toThrow();
      expect(normalCallback).toHaveBeenCalledWith('payload');
    });

    it('should emit to wildcard listeners', () => {
      const wildcardCallback = jest.fn();
      const specificCallback = jest.fn();
      emitter.on('*', wildcardCallback);
      emitter.on('test', specificCallback);
      emitter.emit('test', 'payload');
      expect(wildcardCallback).toHaveBeenCalledWith('test', 'payload');
      expect(specificCallback).toHaveBeenCalledWith('payload');
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for a specific event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      emitter.on('test1', callback1);
      emitter.on('test2', callback2);
      emitter.removeAllListeners('test1');
      emitter.emit('test1', 'payload');
      emitter.emit('test2', 'payload');
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should remove all listeners if no event specified', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      emitter.on('test1', callback1);
      emitter.on('test2', callback2);
      emitter.removeAllListeners();
      emitter.emit('test1', 'payload');
      emitter.emit('test2', 'payload');
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('listenerCount', () => {
    it('should return correct listener count', () => {
      expect(emitter.listenerCount('test')).toBe(0);
      emitter.on('test', jest.fn());
      expect(emitter.listenerCount('test')).toBe(1);
      emitter.on('test', jest.fn());
      expect(emitter.listenerCount('test')).toBe(2);
    });
  });

  describe('eventNames', () => {
    it('should return all event names with listeners', () => {
      emitter.on('test1', jest.fn());
      emitter.on('test2', jest.fn());
      const names = emitter.eventNames();
      expect(names).toContain('test1');
      expect(names).toContain('test2');
    });
  });
});
