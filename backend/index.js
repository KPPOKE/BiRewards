import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usersRoute from './routes/users.js';
import authRoute from './routes/auth.js';  // import route login

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', usersRoute);
app.use('/api', authRoute); // tambahkan route login di sini

app.listen(3000, () => {
  console.log('Backend berjalan di http://localhost:3000');
});