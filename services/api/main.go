package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5" // router
	"github.com/go-chi/chi/v5/middleware" // middleware
	"github.com/jackc/pgx/v5/pgxpool"
)

type statusResponse struct {
	Status string `json:"status"` // e.g. {status: "ok"}
}

func main() {
	port := envOr("PORT", "8080") // default port is 8080
	databaseURL := os.Getenv("DATABASE_URL") // database URL is injected by the environment (Docker, Kuberentes, etc.)


	r := chi.NewRouter() // create a new router

	// Middleware = “wrappers” around every request.
	// Think: logging, tracing, auth, rate limiting, request IDs.
	r.Use(middleware.RequestID) // uniquely identify each request
	r.Use(middleware.RealIP) // get the real IP address of the client
	r.Use(middleware.Recoverer) // recover from panics
	r.Use(middleware.Timeout(10 * time.Second)) // kills the request after 10 seconds

	// Tiny structured-ish access log
	r.Use(middleware.Logger) // log the request

	// DB pool (optional for now: service can start without DB, but won't be "ready")
	var pool *pgxpool.Pool // pool is a connection pool for the database
	if databaseURL != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second) // context with timeout
		defer cancel() // cancel the context when the function returns

		p, err := pgxpool.New(ctx, databaseURL) // create a new connection pool
		if err != nil {
			log.Printf("db pool init failed: %v", err) // log the error
		} else {
			// Try an initial ping so we fail fast (but still start).
			pingCtx, pingCancel := context.WithTimeout(context.Background(), 2*time.Second) // context with timeout
			defer pingCancel() // cancel the context when the function returns
			if err := p.Ping(pingCtx); err != nil {
				log.Printf("db ping failed at startup: %v", err) // log the error
			} else {
				log.Printf("db connected")
			}
			pool = p
			defer pool.Close()
		}
	} else {
		log.Printf("DATABASE_URL not set; readiness will report not-ready")
	}

	// when the user visits /healthz, this function will be called
	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, statusResponse{Status: "ok"})
	})

	// Readiness: only "ready" if DB is reachable.
	r.Get("/readyz", func(w http.ResponseWriter, req *http.Request) {
		if pool == nil {
			writeJSON(w, http.StatusServiceUnavailable, statusResponse{Status: "not-ready"})
			return
		}

		ctx, cancel := context.WithTimeout(req.Context(), 1*time.Second)
		defer cancel()

		if err := pool.Ping(ctx); err != nil {
			writeJSON(w, http.StatusServiceUnavailable, statusResponse{Status: "not-ready"})
			return
		}

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

func envOr(k, def string) string {
	v := os.Getenv(k)
	if v == "" {
		return def
	}
	return v
}

var _ = errors.New // keep for future patterns (ignored now)

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