class Emitter<T extends EventMap> {
  private listeners: { [K in keyof T]?: EmitterCallback<T[K]>[] } = {};

  /**
   * Add an event listener with to the specified event
   * @param name
   * @param callback
   * @returns
   */
  on<K extends keyof T>(name: K, callback: EmitterCallback<T[K]>): Unsubscribe {
    if (!this.listeners[name]) {
      this.listeners[name] = [];
    }

    this.listeners[name]!.push(callback);

    return () => this.off(name, callback);
  }

  /**
   * Remove an event listener with to the specified event
   *
   * @param name
   * @param callback
   * @returns
   */
  private off<K extends keyof T>(
    name: K,
    callback: EmitterCallback<T[K]>,
  ): void {
    const keyListeners = this.listeners[name];
    if (!keyListeners) {
      return;
    }

    const updatedListeners = keyListeners.filter((cb) => cb !== callback);

    if (updatedListeners.length === 0) {
      delete this.listeners[name];
    } else {
      this.listeners[name] = updatedListeners;
    }
  }

  /**
   * Emit an event
   *
   * @param name
   * @param payload|undefined
   * @returns
   */
  async emit<K extends keyof T>(name: K, payload: T[K]): Promise<void> {
    const keyListeners = this.listeners[name];

    if (!keyListeners || keyListeners.length === 0) {
      return;
    }

    const promises = keyListeners.map((callback) => {
      try {
        return Promise.resolve(callback(payload));
      } catch (error) {
        console.error(`Error in listener for event "${String(name)}":`, error);
        return Promise.reject(error);
      }
    });

    await Promise.allSettled(promises);
  }
}

export default Emitter;
