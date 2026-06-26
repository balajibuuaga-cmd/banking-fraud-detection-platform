import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export const connectWebSocket = (callback) => {
    const client = new Client({
        webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
        reconnectDelay: 5000,

        onConnect: () => {
            console.log("WebSocket Connected");

            client.subscribe("/topic/fraud-alerts", (message) => {
                const newAlert = JSON.parse(message.body);
                console.log("New Fraud Alert:", newAlert);

                if (callback) {
                    callback(newAlert);
                }
            });

            client.subscribe("/topic/notifications", (message) => {
                const notification = JSON.parse(message.body);
                console.log("New Notification:", notification);

                if (callback) {
                    callback(notification);
                }
            });
        },

        onStompError: (frame) => {
            console.error("STOMP error:", frame);
        },

        onWebSocketError: (error) => {
            console.error("WebSocket error:", error);
        }
    });

    client.activate();

    return () => {
        client.deactivate();
    };
};