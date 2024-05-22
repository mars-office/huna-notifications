import { SignalrMessage } from "./signalr-message";

export interface SendSignalrMessageRequest {
  receiverType: string;
  to?: string;
  message: SignalrMessage;
}