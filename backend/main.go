package main

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/mail"
	"regexp"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/spf13/viper"
	"golang.org/x/crypto/bcrypt"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

type Login struct {
	Login    string `json:"login" binding:"required"`
	Password string `json:"password" binding:"required,gte=8"`
}

type User struct {
	ID        string   `json:"id,omitempty"`
	IdAddress string   `json:"id_address,omitempty"`
	Image     string   `json:"image" binding:"required,url"`
	Name      string   `json:"name" binding:"required,gte=4"`
	Surname   string   `json:"surname" binding:"required,gte=4"`
	Email     string   `json:"email" binding:"required,email"`
	Phone     string   `json:"phone" binding:"required"`
	Cpf       string   `json:"cpf" binding:"required,gte=11,lte=11"`
	Password  string   `json:"password" binding:"required,gte=8"`
	Balance   float64  `json:"balance,omitempty"`
	Role      string   `json:"role,omitempty"`
	Address   *Address `json:"address" binding:"required"`
}

type Address struct {
	ID         string `json:"id,omitempty"`
	PostalCode string `json:"postalcode" binding:"gte=8,lte=8,required"`
	Number     int64  `json:"number" binding:"required"`
	Street     string `json:"street" binding:"required,lte=255"`
	District   string `json:"district" binding:"required,lte=60"`
	City       string `json:"city" binding:"required,lte=60"`
	State      string `json:"state" binding:"required,lte=20"`
	Complement string `json:"complement" binding:"lte=255"`
}

type Bus struct {
	ID   string  `json:"id,omitempty"`
	Name string  `json:"name" binding:"required"`
	Fare float64 `json:"fare,omitempty"`
}

type BusStats struct {
	ID    string  `json:"id,omitempty"`
	IdBus string  `json:"id_bus,omitempty"`
	Lat   float64 `json:"lat" binding:"required"`
	Lng   float64 `json:"lng" binding:"required"`
	Date  string  `json:"date,omitempty"`
}

type Uid struct {
	Uid    string `json:"uid" binding:"required"`
	IdUser string `json:"id_user,omitempty"`
}

type Fare struct {
	ID     string  `json:"id,omitempty"`
	IdBus  string  `json:"id_bus" binding:"required"`
	IdUser string  `json:"id_user,omitempty"`
	Uid    string  `json:"uid" binding:"required"`
	Fare   float64 `json:"fare,omitempty"`
	Date   string  `json:"date,omitempty"`
	User   *User   `json:"user,omitempty"`
}

type FareHistory struct {
	ID      string  `json:"id"`
	Date    string  `json:"date"`
	NameBus string  `json:"name_bus"`
	FareBus float64 `json:"fare_bus"`
}

var db *sql.DB
var hub *Hub

var JwtSecret []byte

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func VerifyPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func Map[T, V any](ts []T, fn func(T) V) []V {
	result := make([]V, len(ts))
	for i, t := range ts {
		result[i] = fn(t)
	}
	return result
}

func validateEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}

func validatePhone(phone string) bool {
	regex := regexp.MustCompile(`^\d{10,11}$`)
	return regex.MatchString(phone)
}

func validateCPF(cpf string) bool {
	if !regexp.MustCompile(`^\d{11}$`).MatchString(cpf) {
		return false
	}

	invalids := []string{
		"00000000000", "11111111111", "22222222222",
		"33333333333", "44444444444", "55555555555",
		"66666666666", "77777777777", "88888888888",
		"99999999999",
	}
	for _, v := range invalids {
		if cpf == v {
			return false
		}
	}

	for t := 9; t < 11; t++ {
		sum := 0
		for i := 0; i < t; i++ {
			sum += int(cpf[i]-'0') * (t + 1 - i)
		}
		d := (sum * 10) % 11
		if d == 10 {
			d = 0
		}
		if d != int(cpf[t]-'0') {
			return false
		}
	}

	return true
}

type ginContextAdapter struct {
	c *gin.Context
}

func (g *ginContextAdapter) Writer() http.ResponseWriter { return g.c.Writer }
func (g *ginContextAdapter) Request() *http.Request      { return g.c.Request }

func main() {
	viper.SetConfigFile(".env")
	viper.ReadInConfig()

	jwt_secret, ok := viper.Get("JWT_SECRET").(string)

	if !ok {
		log.Fatal("Invalid JWT SECRET")
	}

	JwtSecret = []byte(jwt_secret)

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

	v1 := router.Group("v1")

	// admin := v1.Group("admin")

	bus := v1.Group("bus")
	bus.GET("/", getBuses)
	bus.GET("/:id", getBus)
	bus.GET("/:id/stats", getBusStats)
	bus.POST("/", createBus)
	bus.POST("/:id/stats", createBusStats)
	bus.POST("/fare", createFare)

	auth := v1.Group("auth")
	auth.POST("/register", createUser)
	auth.POST("/login", signInUser)

	user := v1.Group("user")
	user.Use(TokenAuthMiddleware())
	user.GET("/info/basic", getBasicInfoUser)
	user.GET("/fare/history/:id", getFaresByUser)

	hub = NewHub()

	v1.GET("/ws", func(ctx *gin.Context) {
		hub.HandleWS(&ginContextAdapter{c: ctx})
	})

	router.Run(":8080")
}
func TokenAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.Request.Header.Get("Authorization")

		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
			return
		}

		if strings.HasPrefix(token, "Bearer ") {
			token = token[len("Bearer "):]
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header"})
			return
		}

		err := verifyToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired authorization header"})
			return
		}

		c.Set("token", token)
		c.Next()
	}
}

func getBuses(c *gin.Context) {
	c.Header("Content-Type", "application/json")

	rows, err := db.Query("SELECT id, name FROM bus")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	var buses []Bus
	for rows.Next() {
		var a Bus
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

	var bus Bus
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

	var bus_sts []BusStats
	for rows.Next() {
		var a BusStats
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

func getBasicInfoUser(c *gin.Context) {
	v, exists := c.Get("token")
	if !exists {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header"})
		return
	}

	token, ok := v.(string)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header"})
		return
	}

	IdUserToken, err := getUserIDFromToken(token)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Cannot get ID with this TOKEN"})
		return
	}

	var user User
	row := db.QueryRow("SELECT image, name, surname, balance FROM users WHERE id = $1;", IdUserToken)

	err_row := row.Scan(&user.Image, &user.Name, &user.Surname, &user.Balance)

	if err_row != nil {
		if err_row == sql.ErrNoRows {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "No data found with ID: " + IdUserToken})
			return
		} else {
			log.Fatal(err_row)
		}
	}

	c.IndentedJSON(http.StatusOK, gin.H{"image": user.Image, "name": user.Name, "surname": user.Surname, "balance": user.Balance})
}

func getFaresByUser(c *gin.Context) {
	IdUser := c.Param("id")
	err_id := uuid.Validate(IdUser)
	if err_id != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "ID must be a valid UUID"})
		return
	}

	v, exists := c.Get("token")
	if !exists {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header"})
		return
	}

	token, ok := v.(string)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header"})
		return
	}

	IdUserToken, err := getUserIDFromToken(token)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Cannot get ID with this TOKEN"})
		return
	}

	if IdUser == IdUserToken {
		rows, err := db.Query("SELECT f.id as id, f.date as date, b.name as bus_name, b.fare as bus_fare FROM fares f JOIN bus b ON b.id = f.id_bus WHERE f.id_user = $1 ORDER BY f.date DESC;", IdUserToken)
		if err != nil {
			if err == sql.ErrNoRows {
				c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "No data found with ID: " + IdUserToken})
				return
			} else {
				log.Fatal(err)
			}
		}
		defer rows.Close()

		var fareHistory []FareHistory

		for rows.Next() {
			var a FareHistory
			err := rows.Scan(&a.ID, &a.Date, &a.NameBus, &a.FareBus)
			if err != nil {
				log.Fatal(err)
			}
			fareHistory = append(fareHistory, a)
		}

		err = rows.Err()
		if err != nil {
			log.Fatal(err)
		}

		c.IndentedJSON(http.StatusOK, fareHistory)
	} else {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "IDs are not equals"})
	}
}

func createDateString(time time.Time) string {
	if time.IsZero() {
		return ""
	}
	return time.Format("2006-01-02T15:04:05-0700")
}

func createFare(c *gin.Context) {
	c.Header("Content-Type", "application/json")

	var fare Fare

	if err := c.ShouldBindJSON(&fare); err != nil {
		var ValidationErrors validator.ValidationErrors
		if errors.As(err, &ValidationErrors) {
			errorMessages := make([]string, len(ValidationErrors))
			for i, fieldError := range ValidationErrors {
				errorMessages[i] = fmt.Sprintf("Field '%s' failed validation: %s", fieldError.Field(), fieldError.Tag())
			}
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "errors": errorMessages})
		} else {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "errors": err.Error()})
		}
		return
	}

	var bus Bus
	row_bus := db.QueryRow("SELECT id, name, fare FROM bus WHERE id = $1", fare.IdBus)

	err_bus := row_bus.Scan(&bus.ID, &bus.Name, &bus.Fare)

	if err_bus != nil {
		if err_bus == sql.ErrNoRows {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "No data found with ID: " + fare.IdBus})
			return
		} else {
			log.Fatal(err_bus)
		}
	}

	var user User
	row_user := db.QueryRow("SELECT us.id, us.image, us.name, us.surname, us.balance FROM users us LEFT JOIN uids ui ON ui.id_user = us.id WHERE ui.uid = $1", fare.Uid)

	err_user := row_user.Scan(&user.ID, &user.Image, &user.Name, &user.Surname, &user.Balance)

	if err_user != nil {
		if err_user == sql.ErrNoRows {
			hub.BroadcastToID(bus.ID, gin.H{"type": "error", "error": gin.H{"type": "USER_NOT_FOUND", "message": "Nenhum usuário encontrado com este cartão"}})
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "No data found with UID: " + fare.Uid})
			return
		} else {
			log.Fatal(err_user)
		}
	}

	if (user.Balance - bus.Fare) < 0 {
		hub.BroadcastToID(bus.ID, gin.H{"type": "error", "error": gin.H{"type": "INSUFFICIENT_BALANCE", "message": "Saldo insuficiente, Saldo: R$ " + fmt.Sprintf("%.2f", user.Balance)}})
		c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "Saldo insuficiente, Saldo: R$ " + fmt.Sprintf("%.2f", user.Balance)})
		return
	}

	stmt, err := db.Prepare("INSERT INTO fares (id, id_bus, id_user, date) VALUES ($1, $2, $3, $4)")
	if err != nil {
		log.Fatal(err)
	}
	defer stmt.Close()

	id_fare := uuid.New()

	loc := time.FixedZone("BRT", -3*60*60)
	time := time.Now().In(loc)

	if _, err := stmt.Exec(id_fare, bus.ID, user.ID, createDateString(time)); err != nil {
		log.Fatal(err)
	}

	stmt_update, err := db.Prepare("UPDATE users SET balance = $1 WHERE id = $2")
	if err != nil {
		log.Fatal(err)
	}
	defer stmt_update.Close()

	if _, err := stmt_update.Exec((user.Balance - bus.Fare), user.ID); err != nil {
		log.Fatal(err)
	}

	hub.BroadcastToID(bus.ID, gin.H{"type": "success", "id": user.ID, "image": user.Image, "name": user.Name, "surname": user.Surname, "fare": bus.Fare, "old_balance": user.Balance, "balance": (user.Balance - bus.Fare)})
	c.IndentedJSON(http.StatusOK, gin.H{"id": user.ID, "name": user.Name, "surname": user.Surname, "fare": bus.Fare, "old_balance": user.Balance, "balance": (user.Balance - bus.Fare)})
}

func signInUser(c *gin.Context) {
	var login Login

	if err := c.ShouldBindJSON(&login); err != nil {
		var ValidationErrors validator.ValidationErrors
		if errors.As(err, &ValidationErrors) {
			errorMessages := make([]string, len(ValidationErrors))
			for i, fieldError := range ValidationErrors {
				errorMessages[i] = fmt.Sprintf("Field '%s' failed validation: %s", fieldError.Field(), fieldError.Tag())
			}
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "errors": errorMessages})
		} else {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "errors": err.Error()})
		}
		return
	}

	var user User
	var row_user *sql.Row

	if validateEmail(login.Login) {
		row_user = db.QueryRow("SELECT id, role, name, surname, password FROM users WHERE role = $1 AND email = $2", "USER", login.Login)
	} else if validateCPF(login.Login) {
		row_user = db.QueryRow("SELECT id, role, name, surname, password FROM users WHERE role = $1 AND cpf = $2", "USER", login.Login)
	} else if validatePhone(login.Login) {
		row_user = db.QueryRow("SELECT id, role, name, surname, password FROM users WHERE role = $1 AND phone = $2", "USER", login.Login)
	} else {
		c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "Login ou Senha estão incorretos!"})
		return
	}

	err_user := row_user.Scan(&user.ID, &user.Role, &user.Name, &user.Surname, &user.Password)

	if err_user != nil {
		if err_user == sql.ErrNoRows {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "Login ou Senha estão incorretos!"})
			return
		} else {
			log.Fatal(err_user)
		}
	}

	if VerifyPassword(login.Password, user.Password) {
		token, _ := createToken(user.ID, user.Role)
		c.IndentedJSON(http.StatusOK, gin.H{"id": user.ID, "name": user.Name, "surname": user.Surname, "token": token})
	} else {
		c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "Login ou Senha estão incorretos!"})
	}
}

// func getUserByUid(c *gin.Context) {
// 	c.Header("Content-Type", "application/json")

// 	var uid Uid

// 	if err := c.ShouldBindJSON(&uid); err != nil {
// 		var ValidationErrors validator.ValidationErrors
// 		if errors.As(err, &ValidationErrors) {
// 			errorMessages := make([]string, len(ValidationErrors))
// 			for i, fieldError := range ValidationErrors {
// 				errorMessages[i] = fmt.Sprintf("Field '%s' failed validation: %s", fieldError.Field(), fieldError.Tag())
// 			}
// 			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "errors": errorMessages})
// 		} else {
// 			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "errors": err.Error()})
// 		}
// 		return
// 	}

// 	var user User
// 	row := db.QueryRow("SELECT id, username FROM users us LEFT JOIN uids ui ON ui.id_user = us.id WHERE ui.uid = $1", uid.Uid)

// 	err := row.Scan(&user.ID, &user.Username)

// 	if err != nil {
// 		if err == sql.ErrNoRows {
// 			hub.Broadcast(gin.H{"error": "No data found with UID: " + uid.Uid})
// 			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "No data found with UID: " + uid.Uid})
// 			return
// 		} else {
// 			log.Fatal(err)
// 		}
// 	}

// 	hub.Broadcast(gin.H{"id": user.ID, "username": user.Username})
// 	c.IndentedJSON(http.StatusOK, gin.H{"id": user.ID, "username": user.Username})
// }

func createUser(c *gin.Context) {
	var user User

	if err := c.ShouldBindJSON(&user); err != nil {
		var ValidationErrors validator.ValidationErrors
		if errors.As(err, &ValidationErrors) {
			errorMessages := make([]string, len(ValidationErrors))
			for i, fieldError := range ValidationErrors {
				errorMessages[i] = fmt.Sprintf("Field '%s' failed validation: %s", fieldError.Field(), fieldError.Tag())
			}
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "errors": errorMessages})
		} else {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "errors": err.Error()})
		}
		return
	}

	stmt_address, err := db.Prepare("INSERT INTO addresses (id, postalcode, number, street, district, city, state, complement) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)")
	if err != nil {
		log.Fatal(err)
	}
	defer stmt_address.Close()

	id_address := uuid.New()

	if _, err := stmt_address.Exec(id_address, user.Address.PostalCode, user.Address.Number, user.Address.Street, user.Address.District, user.Address.City, user.Address.State, user.Address.Complement); err != nil {
		log.Fatal(err)
	}

	stmt, err := db.Prepare("INSERT INTO users (id, id_address, image, name, surname, email, phone, cpf, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)")
	if err != nil {
		log.Fatal(err)
	}
	defer stmt.Close()

	id_user := uuid.New()
	hashPassword, _ := HashPassword(user.Password)

	if _, err := stmt.Exec(id_user, id_address, user.Image, user.Name, user.Surname, user.Email, user.Phone, user.Cpf, hashPassword); err != nil {
		log.Fatal(err)
	}

	c.IndentedJSON(http.StatusCreated, gin.H{"message": "User successfully created!", "id": id_user})
}

func createBus(c *gin.Context) {

	var bus Bus
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

	var bus Bus
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

	var bus_stats BusStats
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
