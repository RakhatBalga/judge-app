package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"

	"judgeapp/backend/internal/app"
)

func main() {
	dbPath := envOr("JUDGE_DB", "judge.db")
	db, err := app.InitDB(dbPath)
	if err != nil {
		log.Fatalf("init db: %v", err)
	}
	defer db.Close()

	if err := app.Seed(db); err != nil {
		log.Fatalf("seed: %v", err)
	}

	jwtSecret := envOr("JWT_SECRET", "dev-insecure-secret-change-me")

	srv := &app.App{DB: db, JWTSecret: []byte(jwtSecret)}

	r := gin.Default()
	srv.RegisterHTTP(r)

	addr := envOr("ADDR", ":8080")
	log.Printf("judge backend listening on %s (db=%s)", addr, dbPath)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
