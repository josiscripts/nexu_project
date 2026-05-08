import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor() {
    const url = process.env.DATABASE_URL;
    if (!url?.trim()) {
      throw new Error(
        'DATABASE_URL no está definida. Revisa el .env y que main.ts importe dotenv/config.',
      );
    }
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('📡 NEXU: Conexión con Supabase establecida.');
    } catch (error) {
      console.error('❌ Error al conectar con Supabase:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    console.log('🛑 NEXU: Desconectado de Supabase.');
  }
}
