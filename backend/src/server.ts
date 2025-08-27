import * as dotenv from 'dotenv';
dotenv.config();

import app from './app';
import connectDB from './config/database';

const port = process.env.PORT || 3000;

// Connect to the database
connectDB();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});