# ---------- build stage ----------
    
    # starts a container image to compile the code, named as build
    FROM golang:1.22-alpine AS build 

    # inside the container, set the working directory to /app
    WORKDIR /app
    
    # Copy go mod files first so deps can be cached
    COPY go.mod go.sum ./
    RUN go mod download
    
    # Copy source code
    COPY . .
    
    # Compile the code into a static binary
    RUN CGO_ENABLED=0 GOOS=linux go build -o api
    
    # ---------- runtime stage ----------
    # starts a fresh tiny image that does not include Go or source code
    FROM alpine:3.20
    
    WORKDIR /app
    
    # Copy only the compiled binary from the build stage
    COPY --from=build /app/api /app/api
    
    # this container runs on port 8080
    EXPOSE 8080
    
    # When the container starts, run the server binary
    CMD ["/app/api"]