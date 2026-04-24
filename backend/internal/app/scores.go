package app

import (
	"database/sql"
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type upsertScoreRequest struct {
	TeamID int64 `json:"teamId" binding:"required"`
	C1     int   `json:"c1"`
	C2     int   `json:"c2"`
	C3     int   `json:"c3"`
	C4     int   `json:"c4"`
	C5     int   `json:"c5"`
}

const maxPerCriterion = 20

func (a *App) UpsertScore(c *gin.Context) {
	u := currentUser(c)
	if u.Role != "judge" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only judges submit scores"})
		return
	}

	var req upsertScoreRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}
	vals := []int{req.C1, req.C2, req.C3, req.C4, req.C5}
	for _, v := range vals {
		if v < 0 || v > maxPerCriterion {
			c.JSON(http.StatusBadRequest, gin.H{"error": "score must be 0..20"})
			return
		}
	}

	var teamExists int
	if err := a.DB.QueryRow(`SELECT 1 FROM teams WHERE id = ?`, req.TeamID).Scan(&teamExists); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "team not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	tx, err := a.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer func() { _ = tx.Rollback() }()

	var prevC1, prevC2, prevC3, prevC4, prevC5 sql.NullInt64
	err = tx.QueryRow(
		`SELECT c1, c2, c3, c4, c5 FROM scores WHERE judge_id = ? AND team_id = ?`,
		u.ID, req.TeamID,
	).Scan(&prevC1, &prevC2, &prevC3, &prevC4, &prevC5)
	hadPrev := err == nil
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)
	if hadPrev {
		_, err = tx.Exec(
			`UPDATE scores SET c1=?, c2=?, c3=?, c4=?, c5=?, updated_at=? WHERE judge_id=? AND team_id=?`,
			req.C1, req.C2, req.C3, req.C4, req.C5, now, u.ID, req.TeamID,
		)
	} else {
		_, err = tx.Exec(
			`INSERT INTO scores(judge_id, team_id, c1, c2, c3, c4, c5, updated_at) VALUES(?,?,?,?,?,?,?,?)`,
			u.ID, req.TeamID, req.C1, req.C2, req.C3, req.C4, req.C5, now,
		)
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fields := []struct {
		name string
		prev sql.NullInt64
		next int
	}{
		{"c1", prevC1, req.C1},
		{"c2", prevC2, req.C2},
		{"c3", prevC3, req.C3},
		{"c4", prevC4, req.C4},
		{"c5", prevC5, req.C5},
	}
	logStmt, err := tx.Prepare(
		`INSERT INTO audit_logs(timestamp, user_id, team_id, field, old_value, new_value) VALUES(?,?,?,?,?,?)`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer logStmt.Close()

	for _, f := range fields {
		if hadPrev && f.prev.Valid && int(f.prev.Int64) == f.next {
			continue
		}
		var oldVal interface{}
		if hadPrev && f.prev.Valid {
			oldVal = f.prev.Int64
		} else {
			oldVal = nil
		}
		if _, err := logStmt.Exec(now, u.ID, req.TeamID, f.name, oldVal, f.next); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	total := req.C1 + req.C2 + req.C3 + req.C4 + req.C5
	c.JSON(http.StatusOK, gin.H{
		"ok": true,
		"score": scoreDTO{
			C1: req.C1, C2: req.C2, C3: req.C3, C4: req.C4, C5: req.C5,
			Total: total, UpdatedAt: now,
		},
	})
}
