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
        const url = configService.get('DATABASE_URL');
        if (url) {
          return {
            type: 'postgres',
            url,
            entities: [User, Team, LeaveRequest],
            synchronize: true, // Auto-create tables (warning: data loss in prod if changes happen)
            logging: true,
            ssl: {
              rejectUnauthorized: false,
            },
          };
        }

        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: parseInt(configService.get('DB_PORT')),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          entities: [User, Team, LeaveRequest],
          synchronize: configService.get('NODE_ENV') === 'development',
          logging: configService.get('NODE_ENV') === 'development',
          ssl: {
            rejectUnauthorized: false,
          },
          extra: {
            max: 10,
            ssl: { rejectUnauthorized: false },
          },
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