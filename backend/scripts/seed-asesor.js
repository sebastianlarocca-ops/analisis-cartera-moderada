#!/usr/bin/env node
/**
 * Crea el primer usuario asesor en la base de datos.
 * Uso: node scripts/seed-asesor.js
 * Requiere: MONGODB_URI en backend/.env
 */

require('dotenv').config({ path: `${__dirname}/../.env` });
const mongoose = require('mongoose');
const readline = require('readline');

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('MONGODB_URI no encontrada en .env'); process.exit(1); }

// Inline del model para no depender del path del backend
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  nombre: String,
  email: { type: String, unique: true, lowercase: true },
  password: { type: String, select: false },
  role: String,
  client_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  activo: { type: Boolean, default: true },
}, { timestamps: true });
userSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});
const User = mongoose.model('User', userSchema);

const ask = (rl, question) => new Promise((res) => rl.question(question, res));

(async () => {
  await mongoose.connect(uri);
  console.log('Conectado a MongoDB.\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const nombre = await ask(rl, 'Nombre completo: ');
  const email = await ask(rl, 'Email: ');
  const password = await ask(rl, 'Password (mín. 8 caracteres): ');

  rl.close();

  if (password.length < 8) { console.error('Password demasiado corto.'); process.exit(1); }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) { console.error('Ya existe un usuario con ese email.'); process.exit(1); }

  const user = await User.create({ nombre, email, password, role: 'asesor' });
  console.log(`\nAsesor creado: ${user.nombre} <${user.email}> (id: ${user._id})`);
  await mongoose.disconnect();
})();
