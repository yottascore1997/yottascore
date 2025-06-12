import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'exam_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export async function connectDB() {
  try {
    const connection = await pool.getConnection()
    console.log('Connected to MySQL database')
    connection.release()
    return pool
  } catch (error) {
    console.error('MySQL connection error:', error)
    throw error
  }
}

export { pool } 