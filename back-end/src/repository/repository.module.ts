import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from 'nestjs-config';
import { UserService } from './user/user.service';
import { RoleService } from './role/role.service';
import { Role, RoleSchema } from './role/role.schema';
import { User, UserSchema } from './user/user.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('db.config'),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
  ],
  providers: [UserService, RoleService],
  exports: [UserService, RoleService],
})
export class RepositoryModule {}
