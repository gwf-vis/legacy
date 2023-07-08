import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ControllerModule } from './controller/controller.module';
import { RepositoryModule } from './repository/repository.module';
import { ConfigModule } from 'nestjs-config';
import { ServiceModule } from './service/service.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.load(path.resolve(__dirname, '*/**!(*.d).config.{ts,js}'), {
      path: path.resolve(process.cwd(), !ENV ? '.env' : `.env.${ENV}`),
    }),
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, 'files'),
      serveRoot: '/files',
    }),
    ControllerModule,
    RepositoryModule,
    ServiceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
