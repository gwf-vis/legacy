import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RoleService } from '@repository/role/role.service';
import { UserService } from '@repository/user/user.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly roleService: RoleService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService,
  ) {}

  @Post('sign-in')
  async signIn(
    @Query('service') service,
    @Query('ticket') ticket,
    @Res({ passthrough: true }) response: Response,
  ) {
    const data = await lastValueFrom(
      await this.httpService
        .get(
          `https://cas.usask.ca/cas/serviceValidate?service=${encodeURIComponent(
            service,
          )}&ticket=${ticket}`,
        )
        .pipe(map((res) => res.data)),
    );
    if (data.indexOf('INVALID_TICKET') >= 1) {
      throw new HttpException('Invalid Ticket', HttpStatus.UNAUTHORIZED);
    } else if (data.indexOf('INVALID_SERVICE') >= 1) {
      throw new HttpException('Invalid Service', HttpStatus.UNAUTHORIZED);
    } else if (data.indexOf('authenticationSuccess') >= 1) {
      const responseSplits = data.split('\n');
      try {
        const nsid = responseSplits[2].split('>')[1].split('<')[0];
        const user = await this.userService.findOne({ username: nsid });
        if (!user) {
          throw Error('No such user.');
        } else {
          const payload = { _id: user._id.toString() };
          const token = this.jwtService.sign(payload);
          response.cookie('access_token', token, {
            httpOnly: true,
          });
        }
      } catch (err) {
        throw new HttpException(
          'Error parsing PAWS response',
          HttpStatus.UNAUTHORIZED,
        );
      }
    }
  }

  @Post('sign-out')
  async signOut(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies['access_token'];
    const _id = this.jwtService.decode(token)?.['_id'];
    const user = (await this.userService.find({ _id }))?.[0];
    if (!user) {
      throw Error('No such user.');
    } else {
      response.clearCookie('access_token');
    }
  }
}
