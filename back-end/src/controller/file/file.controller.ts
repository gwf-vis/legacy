import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import * as directoryTree from 'directory-tree';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@repository/user/user.service';
import { lastValueFrom, map } from 'rxjs';
import { ConfigService } from 'nestjs-config';
import * as fs from 'fs';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('file')
export class FileController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  @Get('tree')
  async getFileTree(@Req() request: Request) {
    const token = request.cookies['access_token'];
    const _id = this.jwtService.decode(token)?.['_id'];
    const user = (await this.userService.find({ _id }))?.[0];

    const fileTree = directoryTree(path.join(process.env.PWD, 'files'));
    fileTree.children = fileTree.children.filter(
      (child) => child.name === user?.username || child.name === 'public',
    );
    return fileTree;
  }

  @Get('fetch/:path(*)')
  async getFileContent(
    @Param('path') filePath: string,
    @Res() response: Response,
  ) {
    response.sendFile(filePath, {
      root: path.join(process.env.PWD, 'files'),
    });
  }

  @Post()
  async createFile(
    @Query('path') path: string,
    @Body() body: { content: string },
    @Req() request: Request,
  ) {
    const token = request.cookies['access_token'];
    const _id = this.jwtService.decode(token)?.['_id'];
    const user = (await this.userService.find({ _id }))?.[0];

    if (path.startsWith(user.username + '/')) {
      fs.writeFileSync(`./files/${path}`, body.content || '');
    }
  }

  @Put()
  async updateFile(
    @Query('path') path: string,
    @Body() body: { content: string },
    @Req() request: Request,
  ) {
    const token = request.cookies['access_token'];
    const _id = this.jwtService.decode(token)?.['_id'];
    const user = (await this.userService.find({ _id }))?.[0];

    if (path.startsWith(user.username + '/')) {
      fs.writeFileSync(`./files/${path}`, body.content || '', { flag: 'w' });
    }
  }

  @Delete()
  async deleteFile(@Query('path') path: string, @Req() request: Request) {
    const token = request.cookies['access_token'];
    const _id = this.jwtService.decode(token)?.['_id'];
    const user = (await this.userService.find({ _id }))?.[0];

    if (path.startsWith(user.username + '/')) {
      fs.unlinkSync(`./files/${path}`);
    }
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 200 * 1024 * 1024 } }),
  )
  async uploadFile(
    @Query('path') path: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() request: Request,
  ) {
    const token = request.cookies['access_token'];
    const _id = this.jwtService.decode(token)?.['_id'];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _user = (await this.userService.find({ _id }))?.[0];

    // const FILE_SIZE_LIMIT = 100 * 1024;
    // if (file.size > FILE_SIZE_LIMIT) {
    //   throw new HttpException(
    //     'The file size is over the limit',
    //     HttpStatus.FORBIDDEN,
    //   );
    // }
    // TODO check personal directory size
    fs.writeFileSync(`./files/${path}/${file.originalname}`, file.buffer, {
      flag: 'w',
    });
  }

  @Post('run')
  async runCode(@Body('code') code: string, @Req() request: Request) {
    const token = request.cookies['access_token'];
    const _id = this.jwtService.decode(token)?.['_id'];
    const user = (await this.userService.find({ _id }))?.[0];

    const pythonRunnerUrl = `${
      this.configService.get('python-runner.config')['baseUrl']
    }/run`;
    console.log(pythonRunnerUrl);
    const data = await lastValueFrom(
      this.httpService
        .post(pythonRunnerUrl, code, {
          headers: { 'Content-type': 'text/plain' },
        })
        .pipe(map((res) => res.data)),
    );
    const id = new Date().getTime().toString();
    console.log(`${user?.username}`);
    fs.mkdirSync(
      path.join(process.env.PWD, `files/${user?.username || 'guest'}/history`),
      {
        recursive: true,
      },
    );
    fs.writeFileSync(
      path.join(
        process.env.PWD,
        `files/${user?.username || 'guest'}/history/${id}.json`,
      ),
      JSON.stringify(data?.result),
      { encoding: 'utf-8' },
    );
    return {
      id,
      output: data.output,
      result: data.result,
    };
  }

  @Get('vis')
  async obtainVisConfig(
    @Query('user') username: string,
    @Query('id') id: string,
  ) {
    return fs.readFileSync(
      path.join(
        process.env.PWD,
        `files/${username || 'guest'}/history/${id}.json`,
      ),
      { encoding: 'utf-8' },
    );
  }

  @Post('query')
  async queryDB(
    @Query('path') dbPath: string,
    // @Req() request: Request,
    @Body('sql') sql: string,
  ) {
    // const token = request.cookies['access_token'];
    // const _id = this.jwtService.decode(token)?.['_id'];
    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const user = (await this.userService.find({ _id }))?.[0];

    const db = new sqlite3.Database(
      path.join(process.env.PWD, `files/${dbPath.replace('@/', '')}`),
      sqlite3.OPEN_READONLY,
    );

    const queryAsync = (sql: string, params?: any) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, function (error, rows) {
          if (error) reject(error);
          else resolve(rows);
        });
      });
    };

    const result = (await queryAsync(sql)) as any[];
    db.close();

    const columns = Object.keys(result?.[0] || {});
    const values = result?.map((row) => columns?.map((column) => row[column]));
    return {
      columns,
      values,
    };
  }
}
