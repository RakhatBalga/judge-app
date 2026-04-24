package app

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type protocolRow struct {
	TeamID      int64    `json:"teamId"`
	TeamName    string   `json:"teamName"`
	Status      string   `json:"status"`
	AvgC1       *float64 `json:"avgC1"`
	AvgC2       *float64 `json:"avgC2"`
	AvgC3       *float64 `json:"avgC3"`
	AvgC4       *float64 `json:"avgC4"`
	AvgC5       *float64 `json:"avgC5"`
	AvgTotal    *float64 `json:"avgTotal"`
	JudgesVoted int      `json:"judgesVoted"`
}

type protocolResponse struct {
	Rows        []protocolRow  `json:"rows"`
	Judges      []judgeSummary `json:"judges"`
	TotalJudges int            `json:"totalJudges"`
}

type judgeSummary struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	FullName string `json:"fullName"`
}

func (a *App) AnalyticsProtocol(c *gin.Context) {
	rows, err := a.DB.Query(`
		SELECT t.id, t.name, t.status,
		       AVG(s.c1), AVG(s.c2), AVG(s.c3), AVG(s.c4), AVG(s.c5),
		       AVG(CAST(s.c1 + s.c2 + s.c3 + s.c4 + s.c5 AS REAL)),
		       COUNT(s.id)
		FROM teams t
		LEFT JOIN scores s ON s.team_id = t.id
		GROUP BY t.id, t.name, t.status
		ORDER BY t.id ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	out := make([]protocolRow, 0, 128)
	for rows.Next() {
		var r protocolRow
		var a1, a2, a3, a4, a5, at sql.NullFloat64
		if err := rows.Scan(&r.TeamID, &r.TeamName, &r.Status, &a1, &a2, &a3, &a4, &a5, &at, &r.JudgesVoted); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		r.AvgC1 = nullFloat(a1)
		r.AvgC2 = nullFloat(a2)
		r.AvgC3 = nullFloat(a3)
		r.AvgC4 = nullFloat(a4)
		r.AvgC5 = nullFloat(a5)
		r.AvgTotal = nullFloat(at)
		out = append(out, r)
	}

	jRows, err := a.DB.Query(`SELECT id, username, full_name FROM users WHERE role='judge' ORDER BY id`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer jRows.Close()
	judges := make([]judgeSummary, 0, 16)
	for jRows.Next() {
		var j judgeSummary
		if err := jRows.Scan(&j.ID, &j.Username, &j.FullName); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		judges = append(judges, j)
	}

	c.JSON(http.StatusOK, protocolResponse{
		Rows:        out,
		Judges:      judges,
		TotalJudges: len(judges),
	})
}

func nullFloat(n sql.NullFloat64) *float64 {
	if !n.Valid {
		return nil
	}
	v := n.Float64
	return &v
}

type auditLogDTO struct {
	ID        int64  `json:"id"`
	Timestamp string `json:"timestamp"`
	UserID    int64  `json:"userId"`
	Username  string `json:"username"`
	FullName  string `json:"fullName"`
	TeamID    int64  `json:"teamId"`
	TeamName  string `json:"teamName"`
	Field     string `json:"field"`
	OldValue  *int   `json:"oldValue"`
	NewValue  int    `json:"newValue"`
}

type judgeScoreRow struct {
	TeamID   int64  `json:"teamId"`
	TeamName string `json:"teamName"`
	Status   string `json:"status"`
	C1       int    `json:"c1"`
	C2       int    `json:"c2"`
	C3       int    `json:"c3"`
	C4       int    `json:"c4"`
	C5       int    `json:"c5"`
	Total    int    `json:"total"`
}

type judgeScoresEntry struct {
	Judge  judgeSummary    `json:"judge"`
	Scores []judgeScoreRow `json:"scores"`
}

func (a *App) AnalyticsJudgeScores(c *gin.Context) {
	jRows, err := a.DB.Query(`SELECT id, username, full_name FROM users WHERE role='judge' ORDER BY id`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer jRows.Close()
	var judges []judgeSummary
	for jRows.Next() {
		var j judgeSummary
		if err := jRows.Scan(&j.ID, &j.Username, &j.FullName); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		judges = append(judges, j)
	}

	entries := make([]judgeScoresEntry, 0, len(judges))
	for _, j := range judges {
		rows, err := a.DB.Query(`
			SELECT t.id, t.name, t.status,
			       COALESCE(s.c1, 0), COALESCE(s.c2, 0), COALESCE(s.c3, 0),
			       COALESCE(s.c4, 0), COALESCE(s.c5, 0)
			FROM teams t
			LEFT JOIN scores s ON s.team_id = t.id AND s.judge_id = ?
			ORDER BY t.id ASC
		`, j.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var scored []judgeScoreRow
		for rows.Next() {
			var r judgeScoreRow
			if err := rows.Scan(&r.TeamID, &r.TeamName, &r.Status, &r.C1, &r.C2, &r.C3, &r.C4, &r.C5); err != nil {
				rows.Close()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			r.Total = r.C1 + r.C2 + r.C3 + r.C4 + r.C5
			scored = append(scored, r)
		}
		rows.Close()
		entries = append(entries, judgeScoresEntry{Judge: j, Scores: scored})
	}

	c.JSON(http.StatusOK, gin.H{"judges": entries})
}

func (a *App) AnalyticsLogs(c *gin.Context) {
	limit := 500
	if q := c.Query("limit"); q != "" {
		if n, err := strconv.Atoi(q); err == nil && n > 0 && n <= 5000 {
			limit = n
		}
	}

	from := strings.TrimSpace(c.Query("from"))
	to := strings.TrimSpace(c.Query("to"))

	var filterUserID int64
	if q := strings.TrimSpace(c.Query("userId")); q != "" {
		if id, err := strconv.ParseInt(q, 10, 64); err == nil && id > 0 {
			filterUserID = id
		}
	}

	jRows, err := a.DB.Query(`SELECT id, username, full_name FROM users WHERE role='judge' ORDER BY id`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	judges := make([]judgeSummary, 0, 16)
	for jRows.Next() {
		var j judgeSummary
		if err := jRows.Scan(&j.ID, &j.Username, &j.FullName); err != nil {
			jRows.Close()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		judges = append(judges, j)
	}
	jRows.Close()

	q := `
		SELECT l.id, l.timestamp, l.user_id, u.username, u.full_name,
		       l.team_id, t.name, l.field, l.old_value, l.new_value
		FROM audit_logs l
		JOIN users u ON u.id = l.user_id
		JOIN teams t ON t.id = l.team_id
		WHERE 1=1`
	args := make([]interface{}, 0, 6)
	if from != "" {
		q += ` AND l.timestamp >= ?`
		args = append(args, from)
	}
	if to != "" {
		q += ` AND l.timestamp <= ?`
		args = append(args, to)
	}
	if filterUserID > 0 {
		q += ` AND l.user_id = ?`
		args = append(args, filterUserID)
	}
	q += ` ORDER BY l.id DESC LIMIT ?`
	args = append(args, limit)

	rows, err := a.DB.Query(q, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	out := make([]auditLogDTO, 0, limit)
	for rows.Next() {
		var l auditLogDTO
		var oldV sql.NullInt64
		if err := rows.Scan(&l.ID, &l.Timestamp, &l.UserID, &l.Username, &l.FullName,
			&l.TeamID, &l.TeamName, &l.Field, &oldV, &l.NewValue); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if oldV.Valid {
			v := int(oldV.Int64)
			l.OldValue = &v
		}
		out = append(out, l)
	}
	c.JSON(http.StatusOK, gin.H{"logs": out, "judges": judges})
}
