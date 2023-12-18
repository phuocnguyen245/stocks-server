import JWT from 'jsonwebtoken'

const HEADER = {
  API_KEY: 'x-api-key',
  X_CLIENT_ID: 'x-client-id',
  AUTHORIZATION: 'authorization',
  REFRESH_TOKEN: 'refresh-token',
}

export const verifyToken = async (key: string, secretKey: string) => {
  return await JWT.verify(key, secretKey)
}
