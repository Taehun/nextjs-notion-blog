import * as lancedb from '@lancedb/lancedb'
import { getEnv } from './get-config-value'

export async function getVectorDB() {
  const dbURI = getEnv('S3_VECTOR_DB_URI')
  const db = await lancedb.connect(dbURI, {
    storageOptions: {
      awsAccessKeyId: getEnv('AWS_ACCESS_KEY_ID'),
      awsSecretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY')
    }
  })
  return db
}
