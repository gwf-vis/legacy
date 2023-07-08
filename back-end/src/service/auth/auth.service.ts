import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { AUTHENTICATION_HASH_SECRET } from './constants';

@Injectable()
export class AuthService {
  generateServerAuthenticationHash(user: {
    username: string;
    password: string; // TODO may use authenticationHash
  }) {
    const secret = AUTHENTICATION_HASH_SECRET; // TODO use config file
    const inputString = [user.username, secret, user.password].join(',');
    return createHash('sha256').update(inputString).digest('hex');
  }
}
