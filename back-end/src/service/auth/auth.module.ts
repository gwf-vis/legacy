import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthStrategy } from './auth.strategy';
import { AuthService } from './auth.service';
import { JWT_EXPIRES_IN, JWT_SECRET } from './constants';
import { RepositoryModule } from '@repository/repository.module';

@Module({
  imports: [
    JwtModule.register({
      secret: JWT_SECRET, // TODO use .env file to config
      signOptions: {
        expiresIn: JWT_EXPIRES_IN,
      },
    }),
    RepositoryModule,
  ],
  providers: [AuthStrategy, AuthService],
  exports: [JwtModule],
})
export class AuthModule {}
