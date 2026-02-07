/**
 * Deriv WebSocket Connection Manager
 * Handles connection lifecycle, message routing, and subscriptions.
 */

import { DERIV_CONFIG } from './config';

class DerivWebSocket {
    constructor() {
        this.ws = null;
        this.requestId = 0;
        this.pendingRequests = new Map();
        this.subscriptions = new Map();
        this.listeners = new Map();
        this.reconnectAttempt = 0;
        this.pingInterval = null;
        this.isConnecting = false;
        this.authorized = false;
    }

    /**
     * Connect to Deriv WebSocket server
     */
    connect() {
        return new Promise((resolve, reject) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            if (this.isConnecting) {
                reject(new Error('Connection already in progress'));
                return;
            }

            this.isConnecting = true;
            const url = `${DERIV_CONFIG.WS_URL}?app_id=${DERIV_CONFIG.APP_ID}`;

            try {
                this.ws = new WebSocket(url);

                this.ws.onopen = () => {
                    console.log('[Deriv WS] Connected');
                    this.isConnecting = false;
                    this.reconnectAttempt = 0;
                    this._startPing();
                    this._emit('connected');
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    this._handleMessage(event.data);
                };

                this.ws.onerror = (error) => {
                    console.error('[Deriv WS] Error:', error);
                    this._emit('error', error);
                };

                this.ws.onclose = (event) => {
                    console.log('[Deriv WS] Disconnected', event.code);
                    this.isConnecting = false;
                    this.authorized = false;
                    this._stopPing();
                    this._emit('disconnected', event);
                    this._scheduleReconnect();
                };
            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        this._stopPing();
        this.reconnectAttempt = -1; // Prevent reconnection
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.authorized = false;
        this.subscriptions.clear();
        this.pendingRequests.clear();
    }

    /**
     * Send a request and wait for response
     */
    send(request) {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            const reqId = ++this.requestId;
            const message = { ...request, req_id: reqId };

            this.pendingRequests.set(reqId, { resolve, reject });

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(reqId)) {
                    this.pendingRequests.delete(reqId);
                    reject(new Error('Request timeout'));
                }
            }, 30000);

            this.ws.send(JSON.stringify(message));
        });
    }

    /**
     * Subscribe to a stream (ticks, contracts, etc.)
     */
    subscribe(request, callback) {
        const reqId = ++this.requestId;
        const message = { ...request, subscribe: 1, req_id: reqId };

        this.subscriptions.set(reqId, { request, callback });

        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }

        // Return unsubscribe function
        return () => {
            this.subscriptions.delete(reqId);
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.send({ forget: reqId }).catch(() => { });
            }
        };
    }

    /**
     * Forget (unsubscribe) all subscriptions
     */
    forgetAll(streamType) {
        return this.send({ forget_all: streamType });
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }

    /**
     * Check if connected
     */
    get isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    // ─── Private Methods ────────────────────────────────────────────────────────

    _handleMessage(data) {
        try {
            const message = JSON.parse(data);
            const reqId = message.req_id;

            // Handle pong
            if (message.msg_type === 'ping') {
                return;
            }

            // Handle errors
            if (message.error) {
                console.error('[Deriv WS] API Error:', message.error);
                this._emit('api_error', message.error);

                if (reqId && this.pendingRequests.has(reqId)) {
                    const { reject } = this.pendingRequests.get(reqId);
                    this.pendingRequests.delete(reqId);
                    reject(message.error);
                }
                return;
            }

            // Handle pending request response
            if (reqId && this.pendingRequests.has(reqId)) {
                const { resolve } = this.pendingRequests.get(reqId);
                this.pendingRequests.delete(reqId);
                resolve(message);
            }

            // Handle subscription data
            if (reqId && this.subscriptions.has(reqId)) {
                const { callback } = this.subscriptions.get(reqId);
                callback(message);
            }

            // Emit message type event
            this._emit(message.msg_type, message);

            // Special handling for authorize response
            if (message.msg_type === 'authorize') {
                this.authorized = true;
                this._emit('authorized', message.authorize);
            }

        } catch (error) {
            console.error('[Deriv WS] Parse error:', error);
        }
    }

    _emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(cb => cb(data));
        }
    }

    _startPing() {
        this._stopPing();
        this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ ping: 1 }));
            }
        }, DERIV_CONFIG.PING_INTERVAL);
    }

    _stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    _scheduleReconnect() {
        if (this.reconnectAttempt < 0) return; // Manual disconnect

        const delays = DERIV_CONFIG.RECONNECT_DELAYS;
        const delay = delays[Math.min(this.reconnectAttempt, delays.length - 1)];

        this.reconnectAttempt++;
        console.log(`[Deriv WS] Reconnecting in ${delay}ms...`);

        setTimeout(() => {
            this.connect().catch(err => {
                console.error('[Deriv WS] Reconnect failed:', err);
            });
        }, delay);
    }
}

// Singleton instance
export const derivWS = new DerivWebSocket();

export default DerivWebSocket;
