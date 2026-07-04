// Red de seguridad extra: forzamos que el proceso corra en UTC. Ya
// arreglamos el parseo de fechas con parseFechaDB() en todos lados,
// pero esto evita que el mismo bug (fechas de SQLite interpretadas
// como hora local en vez de UTC) vuelva a colarse si alguien agrega
// un `new Date(columnaDeSQLite)` sin pasar por el helper.
process.env.TZ = 'UTC';

const express = require('express');
const session = require('express-session');
const path = require('path');
const { db, initDatabase } = require('./db/database');
const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activity');
const profileRoutes = require('./routes/profile');
const levelRoutes = require('./routes/level');
const pvpRoutes = require('./routes/pvp');
const repairRoutes = require('./routes/repair');
const walletRoutes = require('./routes/wallet');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar base de datos al arrancar
initDatabase();

app.use(express.json());

// Sesiones (email/password, sin Google login).
// NOTA: MemoryStore es para desarrollo. En producción conviene un
// store persistente (ej. connect-sqlite3) para no perder sesiones
// al reiniciar el server.
app.use(session({
  name: 'connect.sid',
  secret: process.env.SESSION_SECRET || 'piratas-del-caribe-dev-secret-cambiar-en-produccion',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 días
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/level', levelRoutes);
app.use('/api/pvp', pvpRoutes);
app.use('/api/repair', repairRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

// Servir archivos estáticos (páginas del juego)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Ruta de salud / diagnóstico: confirma que server + DB están OK
app.get('/api/status', (req, res) => {
  const row = db.prepare('SELECT valor, actualizado_en FROM server_info WHERE clave = ?').get('estado');
  res.json({
    servidor: 'ok',
    juego: 'Piratas del Caribe',
    baseDeDatos: row || null
  });
});

app.listen(PORT, () => {
  console.log(`⚓ Servidor de Piratas del Caribe corriendo en https://piratas-caribe-2.onrender.com`);
});
