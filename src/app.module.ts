import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { LeavesModule } from './leaves/leaves.module';
import { ReportsModule } from './reports/reports.module';
import { User } from './users/user.entity';
import { Team } from './teams/team.entity';
import { LeaveRequest } from './leaves/leave-request.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
        const isProd = nodeEnv === 'production';
        const url = configService.get<string>('DATABASE_URL');

        if (url) {
          return {
            type: 'postgres',
            url,
            entities: [User, Team, LeaveRequest],
            synchronize: false,
            logging: !isProd,
            ssl: {
              rejectUnauthorized: false,
            },
            retryAttempts: 5,
            retryDelay: 3000,
          };
        }

        const host = configService.get<string>('DB_HOST');
        const portValue = configService.get<string>('DB_PORT');
        const username = configService.get<string>('DB_USERNAME');
        const password = configService.get<string>('DB_PASSWORD');
        const database = configService.get<string>('DB_DATABASE');

        if (!host || !username || !password || !database) {
          throw new Error(
            'Database configuration missing. Set DATABASE_URL or DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE.',
          );
        }

        const parsedPort = parseInt(portValue || '5432', 10);

        return {
          type: 'postgres',
          host,
          port: Number.isNaN(parsedPort) ? 5432 : parsedPort,
          username,
          password,
          database,
          entities: [User, Team, LeaveRequest],
          synchronize: !isProd,
          logging: !isProd,
          retryAttempts: 5,
          retryDelay: 3000,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    TeamsModule,
    LeavesModule,
    ReportsModule,
  ],
})
export class AppModule {}