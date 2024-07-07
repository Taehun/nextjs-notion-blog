import * as lancedb from '@lancedb/lancedb'
import { getEnv } from './get-config-value'

export async function getVectorTable() {
  const dbURI = getEnv('S3_VECTOR_DB_URI')
  const conn = await lancedb.connect(dbURI, {
    storageOptions: {
      awsAccessKeyId: getEnv('AWS_ACCESS_KEY_ID'),
      awsSecretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY')
    }
  })
  const table = await conn.openTable('blog-vector')
  return table
}

const apiKey = getEnv('OPENAI_API_KEY')
export const embedding = new lancedb.embedding.OpenAIEmbeddingFunction({
  apiKey: apiKey,
  model: 'text-embedding-3-small'
})
