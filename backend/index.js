import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usersRoute from './routes/users.js';

dotenv.config();
const app = express();
app.use(express.json());

app.use('/api/users', usersRoute);

app.listen(3000, () => {
  console.log('Backend berjalan di http://localhost:3000');
});