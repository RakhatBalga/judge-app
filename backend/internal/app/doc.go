// Package app is the private application layer: HTTP handlers (Gin), SQLite, JWT.
//
// Layout follows common Go practice: [cmd] binaries, [internal] non-importable app code.
// All HTTP and DB access for the REST API live here; there is no separate pkg/ layer yet.
//
// File map (read top-down like the server does):
//
//   - [routes.go]    RegisterHTTP: CORS, /health, route groups, auth + admin handlers wiring
//   - [middleware.go] corsMiddleware, RequireAuth, RequireRole
//   - [auth.go]      Login, Me, password hashing, JWT issue/parse
//   - [db.go]        InitDB, schema DDL, Seed, query helpers
//   - [teams.go]     GET /teams (with per-judge myScore)
//   - [scores.go]    POST /scores, UPSERT, audit log rows
//   - [analytics.go] GET /analytics/protocol, judge-scores, logs
//
// Environment (see root README): JUDGE_DB, JWT_SECRET, ADDR.
package app
