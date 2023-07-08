import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RepositoryBase } from '@repository/repository-base';
import { Document, Model } from 'mongoose';
import { Role, Roles } from './role.schema';

@Injectable()
export class RoleService extends RepositoryBase<Role> {
  private readonly initialRoleNames = Object.values(Roles);

  constructor(@InjectModel(Role.name) model: Model<Role & Document>) {
    super(model);
    this.initialize();
  }

  async initialize() {
    this.initialRoleNames.forEach((name) => this.createRoleIfNotExist(name));
  }

  async createRoleIfNotExist(name: string) {
    const roleExisting = await this.findOne({ name });
    if (!roleExisting) {
      this.insert({
        name,
      });
    }
  }
}
