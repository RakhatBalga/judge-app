package main

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

type teamDTO struct {
	ID          int64    `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Status      string   `json:"status"`
	MyScore     *scoreDTO `json:"myScore,omitempty"`
}

type scoreDTO struct {
	C1        int    `json:"c1"`
	C2        int    `json:"c2"`
	C3        int    `json:"c3"`
	C4        int    `json:"c4"`
	C5        int    `json:"c5"`
	Total     int    `json:"total"`
	UpdatedAt string `json:"updatedAt"`
}

func (a *App) ListTeams(c *gin.Context) {
	u := currentUser(c)
	rows, err := a.DB.Query(`
		SELECT t.id, t.name, t.description, t.status,
		       s.c1, s.c2, s.c3, s.c4, s.c5, s.updated_at
		FROM teams t
		LEFT JOIN scores s ON s.team_id = t.id AND s.judge_id = ?
		ORDER BY t.id ASC
	`, u.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	list := make([]teamDTO, 0, 128)
	for rows.Next() {
		var t teamDTO
		var c1, c2, c3, c4, c5 sql.NullInt64
		var updatedAt sql.NullString
		if err := rows.Scan(&t.ID, &t.Name, &t.Description, &t.Status, &c1, &c2, &c3, &c4, &c5, &updatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if u.Role == "judge" && updatedAt.Valid {
			total := int(c1.Int64 + c2.Int64 + c3.Int64 + c4.Int64 + c5.Int64)
			t.MyScore = &scoreDTO{
				C1: int(c1.Int64), C2: int(c2.Int64), C3: int(c3.Int64),
				C4: int(c4.Int64), C5: int(c5.Int64),
				Total:     total,
				UpdatedAt: updatedAt.String,
			}
		}
		list = append(list, t)
	}
	c.JSON(http.StatusOK, gin.H{"teams": list})
}
