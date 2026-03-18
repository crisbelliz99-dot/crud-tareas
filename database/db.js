import Database from 'better-sqlite3';

const db = new Database('./database.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    texto TEXT NOT NULL,
    hecha INTEGER DEFAULT 0,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  INSERT INTO users (email, password)
  VALUES ('test@gmail.com', '123456');

  INSERT INTO tasks (texto, hecha, user_id)
  VALUES 
  ('Hacer la tarea de informática', 0, 1),
  ('Estudiar para el examen', 1, 1),
  ('Organizar mi proyecto', 0, 1);
`);
console.log('✅ Base de datos lista');

export default db;