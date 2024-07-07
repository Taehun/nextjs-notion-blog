import * as lancedb from '@lancedb/lancedb'

async function initVectorDB() {
  const dbURI = process.env.S3_VECTOR_DB_URI
  const db = await lancedb.connect(dbURI, {
    storageOptions: {
      awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
      awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  })
  const table = await db.createTable('blog-vector', [
    {
      id: 1,
      vector: [0.1, 1.0],
      title: 'dummy',
      tags: ['dummy'],
      content: 'dummy content'
    }
  ])
  return table
}

const table = await initVectorDB()
console.log(table)
