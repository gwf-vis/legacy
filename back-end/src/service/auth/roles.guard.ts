import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '@repository/role/role.schema';
import { RoleService } from '@repository/role/role.service';
import { ROLES_METADATA_KEY } from './allow-roles.decorator';
import { HttpResponseError, HttpResponseMessage } from './constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roleService: RoleService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<Roles[]>(
      ROLES_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return false;
    }

    const user = context.switchToHttp().getRequest().user;

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: HttpResponseError.USER_NOT_FOUND,
          message: HttpResponseMessage.USER_NOT_FOUND,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const userRole = await this.roleService.findOne({ _id: user.roleId });
    const hasPermission = requiredRoles.includes(userRole.name as Roles);

    if (hasPermission) {
      return hasPermission;
    } else {
      throw new HttpException(
        HttpResponseError.INSUFFICIENT_PRIVILEGES,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
