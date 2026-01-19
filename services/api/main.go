package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux() // url to handler mapping (create a router)

	// when the user visits /healthz, this function will be called
	healthzFunction := func(w http.ResponseWriter, r *http.Request){
		w.WriteHeader(http.StatusOK)
		_, _ = fmt.Fprint(w, "ok")
	}
	mux.HandleFunc("/healthz", healthzFunction)

	addr := ":8080"
	log.Printf("api listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux)) // start server, bind to port and router, block until server is stopped
}