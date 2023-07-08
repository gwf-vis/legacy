import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { RoleService } from '@repository/role/role.service';
import { UserService } from '@repository/user/user.service';
import { Request } from 'express';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';

@Controller('user')
export class UserController {
  constructor(
    private readonly roleService: RoleService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async obtainSelf(@Req() request: Request) {
    // TODO move the logic into service module
    const token = request.cookies['access_token'];
    const _id = this.jwtService.decode(token)?.['_id'];
    const self = await this.userService.findOne({ _id });
    if (self) {
      await this.createUserPersonalDirectory(self.username);
      return {
        username: self.username,
        role: (await this.roleService.findOne({ _id: self.roleId }))?.name,
      };
    } else {
      throw new Error('Access denied.');
    }
  }

  async createUserPersonalDirectory(username: string) {
    const directories = ['scripts', 'datasets', 'plugins'];
    const directoryPaths = directories.map(
      (dir) => `${process.env.PWD}/files/${username}/${dir}`,
    );
    for (const path of directoryPaths) {
      if (!existsSync(path)) {
        await mkdir(path, { recursive: true });
      }
    }
  }
}
