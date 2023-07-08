import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FileController } from './file/file.controller';
import { AuthController } from './auth/auth.controller';
import { RepositoryModule } from '@repository/repository.module';
import { ServiceModule } from '@service/service.module';
import { UserController } from './user/user.controller';

@Module({
  imports: [RepositoryModule, ServiceModule, HttpModule],
  controllers: [FileController, AuthController, UserController],
})
export class ControllerModule {}
