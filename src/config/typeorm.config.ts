import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../users/user.entity';
import { Team } from '../teams/team.entity';
import { LeaveRequest } from '../leaves/leave-request.entity';

config();

const options: any = {
  type: 'postgres',
  entities: [User, Team, LeaveRequest],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  ssl: {
    rejectUnauthorized: false,
  },
};

if (process.env.DATABASE_URL) {
  options.url = process.env.DATABASE_URL;
} else {
  options.host = process.env.DB_HOST || 'localhost';
  options.port = parseInt(process.env.DB_PORT) || 5432;
  options.username = process.env.DB_USERNAME || 'postgres';
  options.password = process.env.DB_PASSWORD || 'postgres';
  options.database = process.env.DB_DATABASE || 'officeflow';
}

export const AppDataSource = new DataSource(options);