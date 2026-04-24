package app

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// RegisterHTTP mounts all API routes (health, auth, protected groups).
func (a *App) RegisterHTTP(r *gin.Engine) {
	r.Use(corsMiddleware())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true, "time": time.Now().UTC().Format(time.RFC3339)})
	})

	r.POST("/auth/login", a.Login)

	auth := r.Group("/")
	auth.Use(a.RequireAuth())
	{
		auth.GET("/auth/me", a.Me)
		auth.GET("/teams", a.ListTeams)
		auth.POST("/scores", a.UpsertScore)
	}

	adminOnly := r.Group("/")
	adminOnly.Use(a.RequireAuth(), a.RequireRole("admin"))
	{
		adminOnly.GET("/analytics/protocol", a.AnalyticsProtocol)
		adminOnly.GET("/analytics/judge-scores", a.AnalyticsJudgeScores)
		adminOnly.GET("/analytics/logs", a.AnalyticsLogs)
	}
}
