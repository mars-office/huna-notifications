export interface SendSignalrMessageRequest<T> {
  receiverType: string;
  to?: string;
  payload: T;
}