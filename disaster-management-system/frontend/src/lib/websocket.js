import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WS_URL = import.meta.env.VITE_WS_URL || `${window.location.protocol}//${window.location.host}`

export function createStompClient(onConnect) {
  const client = new Client({
    webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
    reconnectDelay: 5000,
    onConnect: () => onConnect?.(client),
  })
  client.activate()
  return client
}

export function subscribeAlerts(client, handler) {
  return client.subscribe('/topic/alerts', (msg) => handler(JSON.parse(msg.body)))
}

export function subscribeShelters(client, handler) {
  return client.subscribe('/topic/shelters', (msg) => handler(JSON.parse(msg.body)))
}

export function subscribeRescue(client, handler) {
  return client.subscribe('/topic/rescue', (msg) => handler(JSON.parse(msg.body)))
}
