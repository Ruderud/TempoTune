import type {
  BridgeCommandPayload,
  BridgeCommandType,
  BridgeMessage,
  BridgeMessageType,
  BridgeNativeToWebMessage,
  BridgeResponse,
  BridgeResponseEnvelope,
} from '@tempo-tune/shared/types';
import type WebView from 'react-native-webview';
import type { RefObject } from 'react';

type MessageHandler = (data: unknown) => Promise<BridgeResponse>;
const IS_DEV = typeof __DEV__ !== 'undefined' && __DEV__;

/** Maps a request type to its corresponding response type. */
const RESPONSE_TYPE: Partial<Record<BridgeMessageType, BridgeMessageType>> = {
  REQUEST_MIC_PERMISSION: 'MIC_PERMISSION_RESPONSE',
};

export class BridgeHandler {
  private handlers: Map<string, MessageHandler> = new Map();
  private webViewRef: RefObject<WebView | null>;

  constructor(webViewRef: RefObject<WebView | null>) {
    this.webViewRef = webViewRef;
  }

  registerHandler<K extends BridgeCommandType>(
    type: K,
    handler: (data: BridgeCommandPayload<K>) => Promise<BridgeResponse>
  ): void {
    this.handlers.set(type, handler as unknown as MessageHandler);
  }

  async handleMessage(rawData: string): Promise<void> {
    try {
      const message: BridgeMessage = JSON.parse(rawData);

      const handler = this.handlers.get(message.type);
      if (!handler) {
        return;
      }

      const response = await handler(message.data);
      const responseType = RESPONSE_TYPE[message.type] ?? message.type;
      const envelope: BridgeResponseEnvelope = {
        type: responseType,
        ...response,
        requestId: message.requestId,
      };
      this.sendToWebView(envelope);
    } catch (error) {
      if (IS_DEV) {
        console.warn(
          '[BridgeHandler.handleMessage] failed to process message',
          error
        );
      }
    }
  }

  sendToWebView(data: BridgeNativeToWebMessage): void {
    const script = `
      window.postMessage(${JSON.stringify(JSON.stringify(data))}, '*');
      true;
    `;
    this.webViewRef.current?.injectJavaScript(script);
  }

  dispose(): void {
    this.handlers.clear();
  }
}
