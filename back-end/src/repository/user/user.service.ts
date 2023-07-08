import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RepositoryBase } from '@repository/repository-base';
import { Roles } from '@repository/role/role.schema';
import { RoleService } from '@repository/role/role.service';
import { mkdir } from 'fs/promises';
import { Document, Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UserService extends RepositoryBase<User> {
  private readonly initialUsers = process.env.INITIAL_USERS?.split(',').map(
    (username) => ({ username }),
  );

  constructor(
    @InjectModel(User.name) model: Model<User & Document>,
    private readonly roleService: RoleService,
  ) {
    super(model);
    this.initialize();
  }

  async initialize() {
    this.initialUsers?.forEach((user) => this.createUserIfNotExist(user));
  }

  async createUserIfNotExist(user: Partial<User>) {
    const userExisting = await this.findOne({ username: user.username });
    const defaultRole = await this.roleService.findOne({ name: Roles.User });
    if (!userExisting) {
      await this.insert({
        username: user.username,
        password: user.password,
        roleId: defaultRole._id,
      });
    }
  }
}
