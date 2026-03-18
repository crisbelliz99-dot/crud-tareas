const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const Database = require("better-sqlite3");

const app = express();

// 🧠 Base de datos SQLite
const db = new Database("database.db");

// Crear tablas automáticamente
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tareas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    texto TEXT NOT NULL,
    hecha INTEGER DEFAULT 0,
    usuario_id INTEGER
  );
`);

console.log("✅ Base de datos lista");

// 🔧 Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "supersecreto",
    resave: false,
    saveUninitialized: false
}));

// 🔐 Middleware de autenticación
function auth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).send("No autorizado");
    }
    next();
}

// 🔹 RUTA INICIAL
app.get("/", (req, res) => {
    res.redirect("/login.html");
});

// 📝 REGISTER
app.post("/register", async (req, res) => {
    const { email, password } = req.body;

    try {
        const hashed = await bcrypt.hash(password, 10);

        db.prepare(`
            INSERT INTO usuarios (email, password)
            VALUES (?, ?)
        `).run(email, hashed);

        res.send("Usuario registrado ✅ <a href='/login.html'>Ir a login</a>");
    } catch (err) {
        console.log(err);
        res.send("Error: ese correo ya existe o hay problema");
    }
});

// 🔑 LOGIN
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const user = db.prepare(`
        SELECT * FROM usuarios WHERE email = ?
    `).get(email);

    if (!user) {
        return res.send("Usuario no encontrado");
    }

    const match = bcrypt.compareSync(password, user.password);

    if (!match) {
        return res.send("Contraseña incorrecta");
    }

    req.session.userId = user.id;

    res.send("Login exitoso ✅ <a href='/tindex.html'>Ir a tareas</a>");
});

// 👤 PERFIL
app.get("/perfil", auth, (req, res) => {
    res.send("Estás autenticada. ID: " + req.session.userId);
});

// 📋 OBTENER TAREAS
app.get("/tasks", auth, (req, res) => {
    try {
        const tareas = db.prepare(`
            SELECT * FROM tareas WHERE usuario_id = ?
        `).all(req.session.userId);

        res.json(tareas);
    } catch (err) {
        console.log(err);
        res.send("Error al obtener tareas");
    }
});

// ➕ CREAR TAREA
app.post("/tasks", auth, (req, res) => {
    const { texto } = req.body;

    try {
        db.prepare(`
            INSERT INTO tareas (texto, usuario_id)
            VALUES (?, ?)
        `).run(texto, req.session.userId);

        res.send("Tarea creada");
    } catch (err) {
        console.log(err);
        res.send("Error al crear tarea");
    }
});

// ✏️ ACTUALIZAR TAREA
app.put("/tasks/:id", auth, (req, res) => {
    const { id } = req.params;
    const { texto, hecha } = req.body;

    try {
        if (texto !== undefined) {
            db.prepare(`
                UPDATE tareas SET texto = ?
                WHERE id = ? AND usuario_id = ?
            `).run(texto, id, req.session.userId);
        }

        if (hecha !== undefined) {
            db.prepare(`
                UPDATE tareas SET hecha = ?
                WHERE id = ? AND usuario_id = ?
            `).run(hecha, id, req.session.userId);
        }

        res.send("Actualizado");
    } catch (err) {
        console.log(err);
        res.send("Error al actualizar");
    }
});

// ❌ BORRAR TAREA
app.delete("/tasks/:id", auth, (req, res) => {
    const { id } = req.params;

    try {
        db.prepare(`
            DELETE FROM tareas
            WHERE id = ? AND usuario_id = ?
        `).run(id, req.session.userId);

        res.send("Borrado");
    } catch (err) {
        console.log(err);
        res.send("Error al borrar");
    }
});

// 🚪 LOGOUT
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login.html");
    });
});

// 🚀 SERVIDOR
app.listen(3000, () => {
    console.log("🚀 Servidor en http://localhost:3000");
});