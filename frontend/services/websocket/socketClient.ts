import { WSEvent, WSEventType } from '../../types/websocket';

type MessageHandler = (event: WSEvent) => void;

class SignalSocketClient {
  private socket: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private isConnecting: boolean = false;
  private reconnectTimer: any = null;
  private url: string = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

  public connect(token: string) {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const fullUrl = `${this.url}?token=${encodeURIComponent(token)}`;

    try {
      this.socket = new WebSocket(fullUrl);

      this.socket.onopen = () => {
        console.log('[Signal WS] Connected successfully');
        this.isConnecting = false;
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed: WSEvent = JSON.parse(event.data);
          this.notifyHandlers(parsed);
        } catch (e) {
          console.error('[Signal WS] Failed to parse message:', e);
        }
      };

      this.socket.onclose = () => {
        console.log('[Signal WS] Disconnected. Scheduling reconnect...');
        this.socket = null;
        this.isConnecting = false;
        this.scheduleReconnect(token);
      };

      this.socket.onerror = (err) => {
        console.error('[Signal WS] Socket error:', err);
      };
    } catch (e) {
      console.error('[Signal WS] Connection error:', e);
      this.scheduleReconnect(token);
    }
  }

  private scheduleReconnect(token: string) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (typeof window !== 'undefined' && localStorage.getItem('signal_token')) {
        this.connect(token);
      }
    }, 3000);
  }

  public subscribe(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  private notifyHandlers(event: WSEvent) {
    this.handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (e) {
        console.error('[Signal WS] Error in event listener:', e);
      }
    });
  }

  public send(event: WSEventType, data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, data }));
    } else {
      console.warn('[Signal WS] Cannot send event - socket not connected');
    }
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const socketClient = new SignalSocketClient();
