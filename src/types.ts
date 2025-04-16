type EventMap<T = any> = Record<string, T>;
type EmitterCallback<Payload = any> = (
  payload: Payload,
) => void | Promise<void>;
type Unsubscribe = () => void;
