package main

import (
	"fmt"
	"gow"
	"math/rand"
	"misc"
	"net/http"
	"time"
)

func main() {
	rand.Seed(time.Now().UTC().UnixNano())

	game := gow.CreateGame()

	http.Handle("/", game)
	http.Handle("/console/", game)
	http.Handle("/game/", game)

	fmt.Println("Server started... listening on port 8020.")

	http.Handle("/styles/", http.StripPrefix("/styles/", http.FileServer(http.Dir(misc.GetRootDir()+"limejs/tywa-client/styles"))))
	http.Handle("/scripts/", http.StripPrefix("/scripts/", http.FileServer(http.Dir(misc.GetRootDir()+"limejs/gamble"))))
	http.Handle("/closure/", http.StripPrefix("/closure/", http.FileServer(http.Dir(misc.GetRootDir()+"limejs/closure"))))
	http.Handle("/lime/", http.StripPrefix("/lime/", http.FileServer(http.Dir(misc.GetRootDir()+"limejs/lime"))))
	http.Handle("/gamble/", http.StripPrefix("/gamble/", http.FileServer(http.Dir(misc.GetRootDir()+"limejs/gamble"))))
	http.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir(misc.GetRootDir()+"limejs/gamble/assets"))))
	http.Handle("/templates/", http.StripPrefix("/templates/", http.FileServer(http.Dir(misc.GetRootDir()+"gamble-server/templates"))))

	http.ListenAndServe(":8020", nil)

}
