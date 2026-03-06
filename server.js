const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "supersecreto",
    resave: false,
    saveUninitialized: false
}));

const db = mysql.createPool({
  host: "127.0.0.1",   
  user: "root",
  password: "",
  database: "crud_tareas",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function auth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).send("No autorizado. Debes iniciar sesión.");
    }
    next();
}
app.get("/", (req, res) => {
    res.redirect("/login.html");
});

app.post("/register", async (req, res) => {
    const { email, password } = req.body;

    try {
        const hashed = await bcrypt.hash(password, 10);

        db.query(
            "INSERT INTO usuarios (email, password) VALUES (?, ?)",
            [email, hashed],
            (err) => {
                if (err) {
                    console.log(err);
                    return res.send("Error al registrar usuario");
                }

                res.send("Usuario registrado correctamente. <a href='/login.html'>Ir a login</a>");
            }
        );
    } catch (error) {
        res.send("Error del servidor");
    }
});
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM usuarios WHERE email = ?",
        [email],
        async (err, results) => {

            if (err) {
                return res.send("Error del servidor");
            }

            if (results.length === 0) {
                return res.send("Usuario no encontrado");
            }

            const user = results[0];

            const match = await bcrypt.compare(password, user.password);

            if (!match) {
                return res.send("Contraseña incorrecta");
            }

            req.session.userId = user.id;

            res.send("Login exitoso. <a href='/tindex.html'>Ir a tareas</a>");
        }
    );
});

app.get("/perfil", auth, (req, res) => {
    res.send("Estás autenticada. Tu ID es: " + req.session.userId);
});

app.get("/tasks", auth, (req, res) => {

    db.query(
        "SELECT * FROM tareas WHERE usuario_id = ?",
        [req.session.userId],
        (err, results) => {
            if (err) {
                return res.send("Error al obtener tareas");
            }

            res.json(results);
        }
    );

});

app.post("/tasks", auth, (req, res) => {

    console.log(req.body);

    const { texto } = req.body;

    db.query(
        "INSERT INTO tareas (texto, usuario_id) VALUES (?, ?)",
        [texto, req.session.userId],
        (err) => {
            if (err) {
                console.log(err);
                return res.send("Error al crear tarea");
            }

            res.send("Tarea creada");
        }
    );

});
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login.html");
    });
});

app.put("/tasks/:id", auth, (req, res) => {
  const { id } = req.params;
  const { texto, hecha } = req.body;

  if (texto !== undefined) {
    db.query(
      "UPDATE tareas SET texto = ? WHERE id = ? AND usuario_id = ?",
      [texto, id, req.session.userId],
      (err) => {
        if (err) return res.send("Error al actualizar");
        res.send("Actualizado");
      }
    );
  } else if (hecha !== undefined) {
    db.query(
      "UPDATE tareas SET hecha = ? WHERE id = ? AND usuario_id = ?",
      [hecha, id, req.session.userId],
      (err) => {
        if (err) return res.send("Error al actualizar");
        res.send("Actualizado");
      }
    );
  }
});

app.delete("/tasks/:id", auth, (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM tareas WHERE id = ? AND usuario_id = ?",
    [id, req.session.userId],
    (err) => {
      if (err) return res.send("Error al borrar");
      res.send("Borrado");
    }
  );
});

app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});