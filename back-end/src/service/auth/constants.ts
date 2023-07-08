export const JWT_SECRET = 'NmE3^UXbg4&@';
export const JWT_EXPIRES_IN = '1h';
export const AUTHENTICATION_HASH_SECRET = '9gZtv@qRRdf3';

export enum HttpResponseError {
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  COOKIE_NOT_EXIST = 'COOKIE_NOT_EXIST',
  USER_NOT_FOUND = 'USER NOT FOUND',
  DUPLICATED_USER_NAME = 'DUPLICATED_USER_NAME',
  INSUFFICIENT_PRIVILEGES = 'INSUFFICIENT PRIVILEGES',
}

export enum HttpResponseMessage {
  USER_NOT_FOUND = 'Missing user',
  DUPLICATED_USER_NAME = 'Such user name already existed',
  TOKEN_EXPIRED = 'Your token has expired',
  WRONG_CREDENTIALS = 'Wrong password or username',
  INSUFFICIENT_PRIVILEGES = 'INSUFFICIENT PRIVILEGES',
}
