// Sync team names from data/exhibition_projects.json into the SQLite DB (by team id ascending).
// Usage from backend/: go run ./cmd/sync-teams [path/to/judge.db]
package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	dbPath := "judge.db"
	if len(os.Args) > 1 {
		dbPath = os.Args[1]
	}
	raw, err := os.ReadFile("data/exhibition_projects.json")
	if err != nil {
		fmt.Fprintln(os.Stderr, "read json:", err)
		os.Exit(1)
	}
	var names []string
	if err := json.Unmarshal(raw, &names); err != nil {
		fmt.Fprintln(os.Stderr, "parse json:", err)
		os.Exit(1)
	}
	db, err := sql.Open("sqlite3", dbPath+"?_foreign_keys=on")
	if err != nil {
		fmt.Fprintln(os.Stderr, "open db:", err)
		os.Exit(1)
	}
	defer db.Close()
	rows, err := db.Query(`SELECT id FROM teams ORDER BY id ASC`)
	if err != nil {
		fmt.Fprintln(os.Stderr, "query:", err)
		os.Exit(1)
	}
	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			fmt.Fprintln(os.Stderr, "scan:", err)
			os.Exit(1)
		}
		ids = append(ids, id)
	}
	rows.Close()
	if len(ids) != len(names) {
		fmt.Fprintf(os.Stderr, "warning: DB has %d teams, JSON has %d names; updating %d rows\n",
			len(ids), len(names), min(len(ids), len(names)))
	}
	n := min(len(ids), len(names))
	tx, err := db.Begin()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	for i := 0; i < n; i++ {
		if _, err := tx.Exec(`UPDATE teams SET name = ? WHERE id = ?`, names[i], ids[i]); err != nil {
			_ = tx.Rollback()
			fmt.Fprintln(os.Stderr, "update:", err)
			os.Exit(1)
		}
	}
	if err := tx.Commit(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Printf("updated %d team name(s) in %s\n", n, dbPath)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
