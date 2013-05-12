package main

import (
	log "code.google.com/p/log4go"
	"fmt"
	"math/rand"
	"misc"
	"net/http"
	"os"
	"time"
	"tywa"
)

func setLogOutput() {
	_, err := os.OpenFile(tywa.LOG_FILE, os.O_RDWR, 0666)
	if err != nil {
		fmt.Println("Unable to open log file. Reason: ", err)
	} else {
		log.AddFilter("file", log.FINE, log.NewFileLogWriter(tywa.LOG_FILE, false))
	}
}

func main() {
	env_setup := misc.SetupEnvironment()
	setLogOutput()

	fmt.Println("WordPoker server is running... ")
	log.Debug("========================== starting server =================================")

	if env_setup == true {
		rand.Seed(time.Now().UTC().UnixNano())

		lobby := tywa.CreateLobby(3)

		http.Handle("/", lobby)
		http.Handle("/lobby/", lobby)
		http.Handle("/login/", lobby)
		http.Handle("/console/", lobby)
		http.Handle("/table/", lobby)

		http.Handle("/styles/", http.StripPrefix("/styles/", http.FileServer(http.Dir(misc.GetRootDir()+"limejs/tywa-client/styles"))))
		http.Handle("/scripts/", http.StripPrefix("/scripts/", http.FileServer(http.Dir(misc.GetRootDir()+"limejs/tywa-client/scripts"))))
		http.Handle("/closure/", http.StripPrefix("/closure/", http.FileServer(http.Dir(misc.GetRootDir()+"limejs/closure"))))
		http.Handle("/lime/", http.StripPrefix("/lime/", http.FileServer(http.Dir(misc.GetRootDir()+"limejs/lime"))))
		http.Handle("/tywa-client/", http.StripPrefix("/tywa-client/", http.FileServer(http.Dir(misc.GetRootDir()+"limejs/tywa-client"))))
		http.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir(misc.GetRootDir()+"limejs/tywa-client/assets"))))
		http.ListenAndServe(":8020", nil)
	} else {
		fmt.Println("Environment not setup correctly. Please check.")
	}
}
