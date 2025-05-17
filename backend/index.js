import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usersRoute from './routes/users.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/users', usersRoute);

app.listen(5000, () => {
  console.log('Backend berjalan di http://localhost:5000');
});
