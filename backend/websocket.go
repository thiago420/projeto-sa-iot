package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type WSMessage struct {
	Type string `json:"type"`
	Data any    `json:"data"`
}

type Hub struct {
	clients  map[*websocket.Conn]bool
	mu       sync.Mutex
	upgrader websocket.Upgrader
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[*websocket.Conn]bool),
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin:     func(r *http.Request) bool { return true },
		},
	}
}

func (h *Hub) HandleWS(cCtx *ginContextAdapter) {
	w := cCtx.Writer()
	r := cCtx.Request()

	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("ws upgrade:", err)
		return
	}
	defer conn.Close()

	h.mu.Lock()
	h.clients[conn] = true
	h.mu.Unlock()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}

	h.mu.Lock()
	delete(h.clients, conn)
	h.mu.Unlock()
}

func (h *Hub) Broadcast(msg any) {
	h.mu.Lock()
	defer h.mu.Unlock()

	b, err := json.Marshal(msg)
	if err != nil {
		log.Println("marshal ws message:", err)
		return
	}

	for conn := range h.clients {
		if err := conn.WriteMessage(websocket.TextMessage, b); err != nil {
			log.Println("ws write:", err)
			conn.Close()
			delete(h.clients, conn)
		}
	}
}
