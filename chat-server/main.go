package main

import (
	"code.google.com/p/go.net/websocket"
	"flag"
	"log"
	"net/http"
	"text/template"
)

var addr = flag.String("addr", ":8080", "http service address")
var chatTempl = template.Must(template.ParseFiles("chat.html"))

func chatHandler(c http.ResponseWriter, req *http.Request) {
	data := map[string]interface{}{}
	data["host"] = req.Host;
	chatTempl.Execute(c, data)
}

func createHub() {
	newHub := &hub{}
	newHub.init();
	http.Handle("/ws/", websocket.Handler(func (ws *websocket.Conn) {
		newHub.wsHandler(ws)
	}))
	go newHub.run()
}

func handleAndRun(h *hub) {
	http.Handle("/ws/", websocket.Handler(func (ws *websocket.Conn) {
		h.wsHandler(ws)
	}))
	go h.run()
}

func main() {
	createHub()

	http.HandleFunc("/", chatHandler)
	if err := http.ListenAndServe(*addr, nil); err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
