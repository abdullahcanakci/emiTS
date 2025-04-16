import { describe, it, expect, beforeEach, vi } from 'vitest';
import Emitter from '../src';

interface TestEvents {
  'event:simple': null;
  'event:data': { id: number; value: string };
  'event:async': { message: string };
  'event:error': { code: number };
}

type SimpleCallback = (payload: TestEvents['event:simple']) => void | Promise<void>;
type DataCallback = (payload: TestEvents['event:data']) => void | Promise<void>;
type AsyncCallback = (payload: TestEvents['event:async']) => void | Promise<void>;
type ErrorCallback = (payload: TestEvents['event:error']) => void | Promise<void>;


describe('Emitter', () => {
  let emitter: Emitter<TestEvents>;
  expect.hasAssertions()

  beforeEach(() => {
    emitter = new Emitter<TestEvents>();
  });

  describe('on', () => {
    it('should register a listener function for an event', async () => {
      const callback = vi.fn<SimpleCallback>();
      emitter.on('event:simple', callback);

      await emitter.emit('event:simple', null)

      expect(callback).toBeCalled()
    });

    it('should allow multiple listeners for the same event', async () => {
      const callback1 = vi.fn<DataCallback>();
      const callback2 = vi.fn<DataCallback>();
      const payload: TestEvents['event:data'] = { id: 1, value: 'test' };

      emitter.on('event:data', callback1);
      emitter.on('event:data', callback2);

      await emitter.emit('event:data', payload)

      expect(callback1).toBeCalledWith(payload)
      expect(callback2).toBeCalledWith(payload)
    });

    it('should return an unsubscribe function', () => {
      const callback = vi.fn<SimpleCallback>();
      const unsubscribe = emitter.on('event:simple', callback);

      expect(unsubscribe).toBeInstanceOf(Function);
    });

    it('should not call after unsubscribe', async () => {
        const callback = vi.fn<SimpleCallback>();
        const unsubscribe = emitter.on('event:simple', callback);
        await emitter.emit('event:simple', '')
        unsubscribe()

        await emitter.emit('event:simple')
        expect(callback).toBeCalledTimes(1)
      });
  });

  describe('emit', () => {
    it('should call the registered listener when its event is emitted', async () => {
      const callback = vi.fn<SimpleCallback>();
      emitter.on('event:simple', callback);

      await emitter.emit('event:simple', null);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should pass the correct payload to the listener', async () => {
      const callback = vi.fn<DataCallback>();
      const payload: TestEvents['event:data'] = { id: 1, value: 'test' };
      emitter.on('event:data', callback);

      await emitter.emit('event:data', payload);

      expect(callback).toHaveBeenCalledWith(payload);
    });

    it('should call all registered listeners for an event', async () => {
      const callback1 = vi.fn<DataCallback>();
      const callback2 = vi.fn<DataCallback>();
      const payload: TestEvents['event:data'] = { id: 2, value: 'multiple' };

      emitter.on('event:data', callback1);
      emitter.on('event:data', callback2);

      await emitter.emit('event:data', payload);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback1).toHaveBeenCalledWith(payload);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledWith(payload);
    });

    it('should not call listeners for different events', async () => {
      const callbackSimple = vi.fn<SimpleCallback>();
      const callbackData = vi.fn<DataCallback>();
      const payload: TestEvents['event:data'] = { id: 3, value: 'other' };

      emitter.on('event:simple', callbackSimple);
      emitter.on('event:data', callbackData);

      await emitter.emit('event:data', payload);

      expect(callbackData).toHaveBeenCalledTimes(1);
      expect(callbackData).toHaveBeenCalledWith(payload);
      expect(callbackSimple).not.toHaveBeenCalled();
    });

    it('should handle events with no listeners gracefully', async () => {
      const errorSpy = vi.spyOn(console, 'error');

      await expect(emitter.emit('event:simple', null)).resolves.toBeUndefined();

      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('should wait for asynchronous listeners to settle', async () => {
      let asyncFinished = false;
      const asyncCallback = vi.fn<AsyncCallback>(async (payload) => {
        await new Promise(resolve => setTimeout(resolve, 50)); 
        asyncFinished = true;
        console.log('Async listener done:', payload.message);
      });

      const syncCallback = vi.fn<AsyncCallback>((payload) => {
        console.log('Sync listener called:', payload.message);
      });

      emitter.on('event:async', asyncCallback);
      emitter.on('event:async', syncCallback);

      const payload: TestEvents['event:async'] = { message: 'wait for me' };
      await emitter.emit('event:async', payload);

      expect(asyncCallback).toHaveBeenCalledWith(payload);
      expect(syncCallback).toHaveBeenCalledWith(payload);
      expect(asyncFinished).toBe(true);
    });

    it('should handle synchronous errors in listeners without stopping others (due to allSettled)', async () => {
      const errorSpy = vi.spyOn(console, 'error');
      const errorCallback = vi.fn<ErrorCallback>(() => {
        throw new Error('Listener failed synchronously!');
      });
      const successCallback = vi.fn<ErrorCallback>();

      emitter.on('event:error', errorCallback);
      emitter.on('event:error', successCallback);

      const payload: TestEvents['event:error'] = { code: 500 };
      await emitter.emit('event:error', payload);

      expect(errorCallback).toHaveBeenCalledWith(payload);
      expect(successCallback).toHaveBeenCalledWith(payload);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in listener for event "event:error"'),
        expect.any(Error)
      );

      errorSpy.mockRestore();
    });

     it('should handle asynchronous rejections in listeners without stopping others (due to allSettled)', async () => {
      const errorSpy = vi.spyOn(console, 'error');
      const rejectCallback = vi.fn<AsyncCallback>(async () => {
          await Promise.resolve();
          throw new Error('Listener failed asynchronously!');
      });
      const successCallback = vi.fn<AsyncCallback>();

      emitter.on('event:async', rejectCallback);
      emitter.on('event:async', successCallback);

      const payload: TestEvents['event:async'] = { message: 'async rejection' };
      await emitter.emit('event:async', payload);

      expect(rejectCallback).toHaveBeenCalledWith(payload);
      expect(successCallback).toHaveBeenCalledWith(payload);
     

      errorSpy.mockRestore();
    });
  });

  describe('unsubscribe / off', () => {
    it('should remove the specific listener via the unsubscribe function', async () => {
      const callback1 = vi.fn<DataCallback>();
      const callback2 = vi.fn<DataCallback>();
      const payload: TestEvents['event:data'] = { id: 4, value: 'unsubscribe' };

      const unsubscribe1 = emitter.on('event:data', callback1);
      emitter.on('event:data', callback2);

      unsubscribe1();

      await emitter.emit('event:data', payload);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledWith(payload);
    });

    it('should not affect other listeners for the same event when unsubscribing one', async () => {
       const callback1 = vi.fn<DataCallback>();
       const callback2 = vi.fn<DataCallback>();
       const callback3 = vi.fn<DataCallback>();
       const payload: TestEvents['event:data'] = { id: 5, value: 'keep others' };

       const unsubscribe1 = emitter.on('event:data', callback1);
       emitter.on('event:data', callback2);
       emitter.on('event:data', callback3);

       unsubscribe1();

       await emitter.emit('event:data', payload);

       expect(callback1).not.toHaveBeenCalled();
       expect(callback2).toHaveBeenCalledTimes(1);
       expect(callback3).toHaveBeenCalledTimes(1);
    });

    it('should not affect listeners for different events when unsubscribing', async () => {
        const callbackData = vi.fn<DataCallback>();
        const callbackSimple = vi.fn<SimpleCallback>();
        const payloadData: TestEvents['event:data'] = { id: 6, value: 'diff event' };

        const unsubscribeData = emitter.on('event:data', callbackData);
        emitter.on('event:simple', callbackSimple);

        unsubscribeData();

        await emitter.emit('event:data', payloadData);
        await emitter.emit('event:simple', null);

        expect(callbackData).not.toHaveBeenCalled();
        expect(callbackSimple).toHaveBeenCalledTimes(1);
        expect(callbackSimple).toHaveBeenCalledWith(null);
    });

     it('should handle unsubscribing a listener that was already removed or never added', () => {
        const callback = vi.fn<SimpleCallback>();
        const unsubscribe = emitter.on('event:simple', callback);

        unsubscribe(); 
        expect(() => unsubscribe()).not.toThrow();
    });
  });
});
