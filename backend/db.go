package main

import (
	"database/sql"
	"errors"
	"log"

	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

type App struct {
	DB        *sql.DB
	JWTSecret []byte
}

const schema = `
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name     TEXT NOT NULL,
    role          TEXT NOT NULL CHECK(role IN ('admin','judge'))
);

CREATE TABLE IF NOT EXISTS teams (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','absent'))
);

CREATE TABLE IF NOT EXISTS scores (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    judge_id   INTEGER NOT NULL REFERENCES users(id),
    team_id    INTEGER NOT NULL REFERENCES teams(id),
    c1         INTEGER NOT NULL DEFAULT 0,
    c2         INTEGER NOT NULL DEFAULT 0,
    c3         INTEGER NOT NULL DEFAULT 0,
    c4         INTEGER NOT NULL DEFAULT 0,
    c5         INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    UNIQUE(judge_id, team_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    user_id   INTEGER NOT NULL REFERENCES users(id),
    team_id   INTEGER NOT NULL REFERENCES teams(id),
    field     TEXT NOT NULL,
    old_value INTEGER,
    new_value INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scores_team ON scores(team_id);
CREATE INDEX IF NOT EXISTS idx_scores_judge ON scores(judge_id);
CREATE INDEX IF NOT EXISTS idx_logs_team ON audit_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_logs_user ON audit_logs(user_id);
`

func InitDB(path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", path+"?_foreign_keys=on&_journal_mode=WAL")
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	if _, err := db.Exec(schema); err != nil {
		return nil, err
	}
	return db, nil
}

type seedUser struct {
	username string
	password string
	fullName string
	role     string
}

var seedUsers = []seedUser{
	{"admin", "adminpass", "Главный судья / Администратор", "admin"},
	{"judge1", "judge1pass", "Судья Иванов И. И.", "judge"},
	{"judge2", "judge2pass", "Судья Петров П. П.", "judge"},
	{"judge3", "judge3pass", "Судья Сидоров С. С.", "judge"},
	{"judge4", "judge4pass", "Судья Кузнецов К. К.", "judge"},
	{"judge5", "judge5pass", "Судья Смирнов С. С.", "judge"},
}

var seedTeams = []string{
	"алабуга", "Көкмұрын бөлімі", "Alpha Innovators", "Beta Builders", "Gamma Coders", "Delta Designers",
	"Epsilon Engineers", "Zeta Hackers", "Eta Creators", "Theta Makers",
	"Iota Pioneers", "Kappa Solvers", "Lambda Thinkers", "Mu Dreamers",
	"Nu Visionaries", "Xi Inventors", "Omicron Crafters", "Pi Architects",
	"Rho Explorers", "Sigma Legends", "Tau Phoenixes", "Upsilon Wolves",
	"Phi Eagles", "Chi Hawks", "Psi Lions", "Omega Panthers",
	"Apex Squad", "Blaze Team", "Cyan Force", "Dawn Riders",
	"Echo Unit", "Flux Collective", "Ghost Protocol", "Helix Group",
	"Iron Forge", "Jade Circuit", "Kinetic Wave", "Lumina Crew",
	"Matrix Core", "Nebula Team", "Orbit Station", "Pulse Squad",
	"Quantum Leap", "Rapid Fire", "Solar Wind", "Titan Force",
	"Ultra Boost", "Vertex Team", "Warp Speed", "X-Factor",
	"Yield Point", "Zenith Crew", "Aero Dynamics", "Bolt Strike",
	"Crystal Clear", "Deep Space", "Electro Surge", "Fusion Lab",
	"Grid Power", "Hyper Drive", "Impact Zone", "Junction Box",
	"Keystone Crew", "Logic Gate", "Micro Sprint", "Nano Tech",
	"Open Source", "Pixel Perfect", "Quick Sort", "Runtime Error",
	"Stack Overflow", "Type Script", "Unit Test", "Vector Field",
	"Web Craft", "XOR Squad", "Yellow Brick", "Zero Bug",
	"Agile Spark", "Binary Stars", "Code Ninjas", "Data Wave",
}

func Seed(db *sql.DB) error {
	var userCount int
	if err := db.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&userCount); err != nil {
		return err
	}
	if userCount == 0 {
		stmt, err := db.Prepare(`INSERT INTO users(username, password_hash, full_name, role) VALUES(?,?,?,?)`)
		if err != nil {
			return err
		}
		defer stmt.Close()
		for _, u := range seedUsers {
			hash, err := bcrypt.GenerateFromPassword([]byte(u.password), bcrypt.DefaultCost)
			if err != nil {
				return err
			}
			if _, err := stmt.Exec(u.username, string(hash), u.fullName, u.role); err != nil {
				return err
			}
		}
		log.Printf("seeded %d users", len(seedUsers))
	}

	var teamCount int
	if err := db.QueryRow(`SELECT COUNT(*) FROM teams`).Scan(&teamCount); err != nil {
		return err
	}
	if teamCount == 0 {
		stmt, err := db.Prepare(`INSERT INTO teams(name) VALUES(?)`)
		if err != nil {
			return err
		}
		defer stmt.Close()
		for _, n := range seedTeams {
			if _, err := stmt.Exec(n); err != nil {
				return err
			}
		}
		log.Printf("seeded %d teams", len(seedTeams))
	}
	return nil
}

var errNotFound = errors.New("not found")
