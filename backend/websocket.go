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
	clientsByID map[string]map[*websocket.Conn]bool
	mu          sync.Mutex
	upgrader    websocket.Upgrader
}

func NewHub() *Hub {
	return &Hub{
		clientsByID: make(map[string]map[*websocket.Conn]bool),
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

	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}

	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("ws upgrade:", err)
		return
	}

	h.mu.Lock()
	if h.clientsByID[id] == nil {
		h.clientsByID[id] = make(map[*websocket.Conn]bool)
	}
	h.clientsByID[id][conn] = true
	h.mu.Unlock()

	// Listen for close
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}

	// Remove on disconnect
	h.mu.Lock()
	delete(h.clientsByID[id], conn)
	h.mu.Unlock()

	conn.Close()
}

func (h *Hub) BroadcastToID(id string, msg any) {
	h.mu.Lock()
	conns := h.clientsByID[id]
	h.mu.Unlock()

	b, err := json.Marshal(msg)
	if err != nil {
		log.Println("marshal ws message:", err)
		return
	}

	for conn := range conns {
		if err := conn.WriteMessage(websocket.TextMessage, b); err != nil {
			log.Println("ws write:", err)
			conn.Close()

			h.mu.Lock()
			delete(h.clientsByID[id], conn)
			h.mu.Unlock()
		}
	}
}

func (h *Hub) BroadcastAll(msg any) {
	h.mu.Lock()
	defer h.mu.Unlock()

	b, _ := json.Marshal(msg)

	for _, conns := range h.clientsByID {
		for conn := range conns {
			conn.WriteMessage(websocket.TextMessage, b)
		}
	}
}
