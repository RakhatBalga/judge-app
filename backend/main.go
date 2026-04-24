package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	dbPath := envOr("JUDGE_DB", "judge.db")
	db, err := InitDB(dbPath)
	if err != nil {
		log.Fatalf("init db: %v", err)
	}
	defer db.Close()

	if err := Seed(db); err != nil {
		log.Fatalf("seed: %v", err)
	}

	jwtSecret := envOr("JWT_SECRET", "dev-insecure-secret-change-me")

	app := &App{DB: db, JWTSecret: []byte(jwtSecret)}

	r := gin.Default()
	r.Use(corsMiddleware())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true, "time": time.Now().UTC().Format(time.RFC3339)})
	})

	r.POST("/auth/login", app.Login)

	auth := r.Group("/")
	auth.Use(app.RequireAuth())
	{
		auth.GET("/auth/me", app.Me)
		auth.GET("/teams", app.ListTeams)
		auth.POST("/scores", app.UpsertScore)
	}

	adminOnly := r.Group("/")
	adminOnly.Use(app.RequireAuth(), app.RequireRole("admin"))
	{
		adminOnly.GET("/analytics/protocol", app.AnalyticsProtocol)
		adminOnly.GET("/analytics/judge-scores", app.AnalyticsJudgeScores)
		adminOnly.GET("/analytics/logs", app.AnalyticsLogs)
	}

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

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, Accept")
		c.Header("Access-Control-Max-Age", "600")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
