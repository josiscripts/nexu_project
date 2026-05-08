import { PrismaClient, UnescoArea, PostCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

// Configurar PrismaClient con el adapter PrismaPg (igual que PrismaService)
const url = process.env.DATABASE_URL;
if (!url?.trim()) {
  throw new Error('DATABASE_URL no está definida. Revisa el archivo .env');
}
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando Seeding de NEXU...');

  // Hashear la contraseña antes de crear el usuario
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Crear usuarios de prueba
  const user1 = await prisma.user.upsert({
    where: { email: 'juan@nexu.com' },
    update: {},
    create: {
      email: 'juan@nexu.com',
      name: 'Juan Pérez',
      password: hashedPassword,
      area: UnescoArea.INGENIERIA,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'maria@nexu.com' },
    update: {},
    create: {
      email: 'maria@nexu.com',
      name: 'María García',
      password: hashedPassword,
      area: UnescoArea.SALUD,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'carlos@nexu.com' },
    update: {},
    create: {
      email: 'carlos@nexu.com',
      name: 'Carlos Rodríguez',
      password: hashedPassword,
      area: UnescoArea.ARTES,
    },
  });

  console.log('✅ Usuarios creados:', user1.name, user2.name, user3.name);

  // Crear posts de prueba en diferentes categorías UNESCO
  const post1 = await prisma.post.create({
    data: {
      content: '¡Bienvenidos al muro social de NEXU! Este es mi primer post desde Ingeniería.',
      imageUrl: null,
      category: PostCategory.INGENIERIA,
      authorId: user1.id,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      content: 'Compartiendo avances sobre la nueva vacuna contra la malaria. #Ciencia #Salud',
      imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=500',
      category: PostCategory.SALUD,
      authorId: user2.id,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      content: 'Mi última obra de arte digital. ¿Qué opinan? 🎨',
      imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500',
      category: PostCategory.ARTES,
      authorId: user3.id,
    },
  });

  const post4 = await prisma.post.create({
    data: {
      content: 'Nuevo estudio sobre el impacto del cambio climático en los océanos.',
      imageUrl: null,
      category: PostCategory.CIENCIAS_NATURALES,
      authorId: user2.id,
    },
  });

  const post5 = await prisma.post.create({
    data: {
      content: '¿Alguien interesado en formar un equipo para el hackathon de educación?',
      imageUrl: null,
      category: PostCategory.EDUCACION,
      authorId: user1.id,
    },
  });

  console.log('✅ Posts creados:', 5);

  // Crear comentarios de prueba
  const comment1 = await prisma.comment.create({
    data: {
      content: '¡Excelente iniciativa! Cuenta conmigo.',
      postId: post1.id,
      authorId: user2.id,
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      content: 'Muy interesante, ¿tienes más información?',
      postId: post2.id,
      authorId: user1.id,
    },
  });

  const comment3 = await prisma.comment.create({
    data: {
      content: 'Me encanta el uso de colores 🔥',
      postId: post3.id,
      authorId: user1.id,
    },
  });

  console.log('✅ Comentarios creados:', 3);

  console.log('🌱 Seed completado exitosamente!');
  console.log('📊 Resumen:');
  console.log(`   - Usuarios: ${await prisma.user.count()}`);
  console.log(`   - Posts: ${await prisma.post.count()}`);
  console.log(`   - Comentarios: ${await prisma.comment.count()}`);
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
