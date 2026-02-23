import type {BridgeMessage, BridgeMessageType, BridgeResponse} from '@tempo-tune/shared/types';
import type WebView from 'react-native-webview';
import type {RefObject} from 'react';

type MessageHandler = (data: unknown) => Promise<BridgeResponse>;

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

  registerHandler(type: string, handler: MessageHandler): void {
    this.handlers.set(type, handler);
  }

  async handleMessage(rawData: string): Promise<void> {
    try {
      const message: BridgeMessage = JSON.parse(rawData);
      console.log('!!DEBUG [BridgeHandler.handleMessage] type:', message.type);

      const handler = this.handlers.get(message.type);
      if (!handler) {
        console.log(
          '!!DEBUG [BridgeHandler.handleMessage] unhandled type:',
          message.type,
        );
        return;
      }

      const response = await handler(message.data);
      const responseType = RESPONSE_TYPE[message.type] ?? message.type;
      this.sendToWebView({
        type: responseType,
        ...response,
        requestId: message.requestId,
      });
    } catch (error) {
      console.log('!!DEBUG [BridgeHandler.handleMessage] error:', error);
    }
  }

  sendToWebView(data: unknown): void {
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
