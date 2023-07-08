import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JWT_SECRET } from './constants';
import { UserService } from '@repository/user/user.service';
import { RoleService } from '@repository/role/role.service';

@Injectable()
export class AuthStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {
    super({
      jwtFromRequest: (req) => {
        if (!req || !req.cookies) return null;
        return req.cookies['access_token'];
      },
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate({ _id }: { _id: string }): Promise<any> {
    const user = await this.userService.findOne({ _id });
    return user;
  }
}
