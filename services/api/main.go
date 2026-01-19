package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5" // router
	"github.com/go-chi/chi/v5/middleware" // middleware
)

type statusResponse struct {
	Status string `json:"status"` // e.g. {status: "ok"}
}

func main() {
	port := os.Getenv("PORT")  // PORT is injected by the environment (Docker, Kuberentes, etc.)
	if port == "" {
		port = "8080" // default port
	}

	r := chi.NewRouter() // create a new router

	// Middleware = “wrappers” around every request.
	// Think: logging, tracing, auth, rate limiting, request IDs.
	r.Use(middleware.RequestID) // uniquely identify each request
	r.Use(middleware.RealIP) // get the real IP address of the client
	r.Use(middleware.Recoverer) // recover from panics
	r.Use(middleware.Timeout(10 * time.Second)) // kills the request after 10 seconds

	// Tiny structured-ish access log
	r.Use(middleware.Logger) // log the request

	// when the user visits /healthz, this function will be called
	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, statusResponse{Status: "ok"})
	})

	// DB connectivity check
	r.Get("/readyz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, statusResponse{Status: "ready"})
	})

	addr := ":" + port
	log.Printf("api listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, r)) // start server, bind to port and router, block until server is stopped
}

// helper function to write JSON to the response
func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code) // set the status code
	_ = json.NewEncoder(w).Encode(v) // encode the response as JSON
}

// func main() {
// 	mux := http.NewServeMux() // url to handler mapping (create a router)

// 	// when the user visits /healthz, this function will be called
// 	healthzFunction := func(w http.ResponseWriter, r *http.Request){
// 		w.WriteHeader(http.StatusOK)
// 		_, _ = fmt.Fprint(w, "ok")
// 	}
// 	mux.HandleFunc("/healthz", healthzFunction)

// 	addr := ":8080"
// 	log.Printf("api listening on %s", addr)
// 	log.Fatal(http.ListenAndServe(addr, mux)) // start server, bind to port and router, block until server is stopped
// }