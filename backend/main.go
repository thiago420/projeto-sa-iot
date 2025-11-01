package main

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/spf13/viper"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

type bus struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type bus_stats struct {
	ID    string  `json:"id"`
	IdBus string  `json:"id_bus"`
	Lat   float64 `json:"lat"`
	Lng   float64 `json:"lng"`
	Date  string  `json:"date"`
}

type bus_body struct {
	Name string `json:"name" binding:"required"`
}

type bus_stats_body struct {
	Lat float64 `json:"lat" binding:"required"`
	Lng float64 `json:"lng" binding:"required"`
}

var db *sql.DB

func main() {
	viper.SetConfigFile(".env")
	viper.ReadInConfig()
	postgresql_uri, ok := viper.Get("POSTGRESQL_URI").(string)

	if !ok {
		log.Fatal("Invalid POSTGRESQL URI")
	}

	var err error
	db, err = sql.Open("postgres", postgresql_uri)
	if err != nil {
		log.Fatal(err)
	}

	router := gin.Default()
	router.GET("/bus", getBuses)
	router.GET("/bus/:id", getBus)
	router.GET("/bus/:id/stats", getBusStats)
	router.POST("/bus", createBus)
	router.POST("/bus/:id/stats", createBusStats)

	router.Run("localhost:8080")
}

func getBuses(c *gin.Context) {
	c.Header("Content-Type", "application/json")

	rows, err := db.Query("SELECT id, name FROM bus")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	var buses []bus
	for rows.Next() {
		var a bus
		err := rows.Scan(&a.ID, &a.Name)
		if err != nil {
			log.Fatal(err)
		}
		buses = append(buses, a)
	}
	err = rows.Err()
	if err != nil {
		log.Fatal(err)
	}

	c.IndentedJSON(http.StatusOK, buses)
}

func getBus(c *gin.Context) {
	c.Header("Content-Type", "application/json")

	id := c.Param("id")
	err_id := uuid.Validate(id)
	if err_id != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "ID must be a valid UUID"})
		return
	}

	var bus bus
	row := db.QueryRow("SELECT id, name FROM bus WHERE id = $1", id)

	err := row.Scan(&bus.ID, &bus.Name)

	if err != nil {
		if err == sql.ErrNoRows {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "No data found with ID: " + id})
			return
		} else {
			log.Fatal(err)
		}
	}

	c.IndentedJSON(http.StatusOK, bus)
}

func getBusStats(c *gin.Context) {
	c.Header("Content-Type", "application/json")

	id := c.Param("id")
	err_id := uuid.Validate(id)
	if err_id != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "ID must be a valid UUID"})
		return
	}

	rows, err := db.Query("SELECT id, id_bus, lat, lng, date FROM bus_stats WHERE id_bus = $1", id)
	if err != nil {
		if err == sql.ErrNoRows {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "No data found with ID: " + id})
			return
		} else {
			log.Fatal(err)
		}
	}
	defer rows.Close()

	var bus_sts []bus_stats
	for rows.Next() {
		var a bus_stats
		err := rows.Scan(&a.ID, &a.IdBus, &a.Lat, &a.Lng, &a.Date)
		if err != nil {
			log.Fatal(err)
		}
		bus_sts = append(bus_sts, a)
	}
	err = rows.Err()
	if err != nil {
		log.Fatal(err)
	}

	c.IndentedJSON(http.StatusOK, bus_sts)
}

func createDateString(time time.Time) string {
	if time.IsZero() {
		return ""
	}
	return time.Format("2006-01-02T15:04:05-0700")
}

func createBus(c *gin.Context) {

	var bus bus_body
	if err := c.ShouldBindJSON(&bus); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	stmt, err := db.Prepare("INSERT INTO bus (id, name) VALUES ($1, $2)")
	if err != nil {
		log.Fatal(err)
	}
	defer stmt.Close()

	id_bus := uuid.New()

	if _, err := stmt.Exec(id_bus, bus.Name); err != nil {
		log.Fatal(err)
	}

	c.IndentedJSON(http.StatusCreated, gin.H{"message": "Bus successfully created!", "id": id_bus})
}

func createBusStats(c *gin.Context) {

	id := c.Param("id")
	err_id := uuid.Validate(id)
	if err_id != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "ID must be a valid UUID"})
		return
	}

	var bus bus
	row := db.QueryRow("SELECT id, name FROM bus WHERE id = $1", id)

	err := row.Scan(&bus.ID, &bus.Name)

	if err != nil {
		if err == sql.ErrNoRows {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "No bus found with ID: " + id})
			return
		} else {
			log.Fatal(err)
		}
	}

	var bus_stats bus_stats_body
	if err := c.ShouldBindJSON(&bus_stats); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	stmt, err := db.Prepare("INSERT INTO bus_stats (id, id_bus, lat, lng, date) VALUES ($1, $2, $3, $4, $5)")
	if err != nil {
		log.Fatal(err)
	}
	defer stmt.Close()

	id_bus_stats := uuid.New()

	loc := time.FixedZone("BRT", -3*60*60)
	time := time.Now().In(loc)

	if _, err := stmt.Exec(id_bus_stats, id, bus_stats.Lat, bus_stats.Lng, createDateString(time)); err != nil {
		log.Fatal(err)
	}

	c.IndentedJSON(http.StatusCreated, gin.H{"message": "Bus stats successfully created!", "id": id_bus_stats})
}
