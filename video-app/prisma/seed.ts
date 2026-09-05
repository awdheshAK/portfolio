/**
 * Seeds accounts and taxonomy only - no placeholder video rows. Videos are
 * created through the real upload + FFmpeg processing pipeline, so a fake
 * "demo video" row here would just be a broken link with no backing media.
 * Run `npm run dev` + `npm run worker`, log in with the seeded admin
 * account below, and upload a real file to see the full pipeline work.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Music', description: 'Live performances, music videos, and covers.' },
  { name: 'Gaming', description: 'Gameplay, walkthroughs, and esports.' },
  { name: 'Education', description: 'Tutorials, lectures, and explainers.' },
  { name: 'Technology', description: 'Product reviews, coding, and tech news.' },
  { name: 'Travel', description: 'Travel vlogs and destination guides.' },
  { name: 'Sports', description: 'Highlights, analysis, and live moments.' },
  { name: 'Comedy', description: 'Sketches, stand-up, and funny moments.' },
  { name: 'News & Politics', description: 'Current events and commentary.' },
];

const TAGS = [
  '4k', 'tutorial', 'review', 'vlog', 'live', 'highlights', 'beginner-friendly', 'behind-the-scenes',
  'shorts', 'interview', 'howto', 'comedy-sketch',
];

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function main() {
  console.log('Seeding categories...');
  for (const [i, cat] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: slugify(cat.name) },
      update: {},
      create: { name: cat.name, slug: slugify(cat.name), description: cat.description, order: i },
    });
  }

  console.log('Seeding tags...');
  for (const tag of TAGS) {
    await prisma.tag.upsert({ where: { slug: slugify(tag) }, update: {}, create: { name: tag, slug: slugify(tag) } });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@streamvault.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!';
  const demoEmail = process.env.SEED_DEMO_EMAIL ?? 'creator@streamvault.local';
  const demoPassword = process.env.SEED_DEMO_PASSWORD ?? 'Creator1234!';

  console.log('Seeding admin account...');
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Site Admin',
      username: 'admin',
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: 'ADMIN',
    },
  });

  console.log('Seeding demo creator account...');
  await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: 'Demo Creator',
      username: 'democreator',
      passwordHash: await bcrypt.hash(demoPassword, 12),
      role: 'CREATOR',
    },
  });

  console.log('\nSeed complete.');
  console.log(`  Admin login:   ${adminEmail} / ${adminPassword}`);
  console.log(`  Creator login: ${demoEmail} / ${demoPassword}`);
  console.log('\nNext: run `npm run dev` and `npm run worker` in separate terminals, log in, and upload a video.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
