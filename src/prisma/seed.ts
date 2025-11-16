import { PrismaClient, ActivityLevel } from '@prisma/client';
import { exerciseSeedData } from './seeds/exercises.seed';
import { userSeedData } from './seeds/users.seed';
import { userProfileSeedData } from './seeds/user-profile.seed';
import * as bcrypt from 'bcrypt';

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser'; 

const prisma = new PrismaClient();

const toFloat = (value: string | undefined): number | undefined => {
  if (value === undefined || value === null || value.trim() === '') {
    return undefined;
  }
  const num = parseFloat(value.replace(',', '.'));
  return isNaN(num) ? undefined : num;
};

async function main() {
  console.log('🌱 Bắt đầu nạp dữ liệu (seeding)...');

  let foodCreated = 0;
  let foodUpdated = 0;
  let exerciseCreated = 0;
  let exerciseUpdated = 0;
  let userCreated = 0;
  let userUpdated = 0;
  let profileCreated = 0;
  let profileUpdated = 0;


  console.log('\n👤 Seeding Users...');
  const rawUsers = await userSeedData();
  const users: any[] = [];
  for (const user of rawUsers) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(user.passwordHash, salt);
    const userData = { ...user, passwordHash: passwordHash };
    if (existing) {
      await prisma.user.update({ where: { email: user.email }, data: userData });
      userUpdated++;
      users.push(existing);
    } else {
      const created = await prisma.user.create({ data: userData });
      userCreated++;
      users.push(created);
    }
  }
  console.log(`👤 Users → ${userCreated} added, ${userUpdated} updated`);

  console.log('\n📋 Seeding User Profiles...');
  for (let i = 0; i < users.length; i++) {
    const profile = userProfileSeedData[i];
    const existing = await prisma.userProfile.findUnique({ where: { userId: users[i].id } });
    let bmi: number | undefined = undefined;
    if (profile.weightKg && profile.heightCm) {
      const heightInMeters = profile.heightCm / 100;
      bmi = parseFloat((profile.weightKg / (heightInMeters * heightInMeters)).toFixed(2));
    }
    const profileData = { ...profile, bmi: bmi };
    if (existing) {
      await prisma.userProfile.update({ where: { userId: users[i].id }, data: profileData });
      profileUpdated++;
    } else {
      await prisma.userProfile.create({ data: { ...profileData, userId: users[i].id } });
      profileCreated++;
    }
  }
  console.log(`📋 Profiles → ${profileCreated} added, ${profileUpdated} updated`);

  console.log('\n🏋️ Seeding Exercises...');
  for (const exercise of exerciseSeedData) {
    const existing = await prisma.exercise.findUnique({ where: { name: exercise.name } });
    if (existing) {
      await prisma.exercise.update({ where: { name: exercise.name }, data: exercise });
      exerciseUpdated++;
    } else {
      await prisma.exercise.create({ data: exercise });
      exerciseCreated++;
    }
  }
  console.log(`🏋️ Exercises → ${exerciseCreated} added, ${exerciseUpdated} updated`);

  // --- PHẦN FOODS  ---
  console.log('\n🥗 Seeding Foods from CSV...');
  await new Promise<void>((resolve, reject) => {
    const results: any[] = [];
 
    const csvFilePath = path.join(__dirname, 'foods_vn.csv');

    fs.createReadStream(csvFilePath)
      // Bỏ qua 2 dòng đầu tiên (dòng tiêu đề và dòng trống)
      .pipe(csv({ skipLines: 2 }))
      .on('data', (data) => results.push(data))
      .on('error', (err) => reject(err))
      .on('end', async () => {
        console.log(`Đã đọc ${results.length} bản ghi từ CSV.`);

        for (const food of results) {
          const name = food['TÊN THỨC ĂN'];
          if (!name || name.trim() === '') {
            continue; // Bỏ qua nếu dòng không có tên
          }

          const foodData = {
            unit: '100g',
            source: 'vietnam_nin',
            // === Macros ===
            calories: toFloat(food.Calories),
            protein: toFloat(food.Protein),
            fat: toFloat(food.Fat),
            carbs: toFloat(food.Carbonhydrates),
            fiber: toFloat(food['Chất xơ']),
            cholesterol: toFloat(food.Cholesterol),
            // === Khoáng chất ===
            calcium: toFloat(food.Canxi),
            iron: toFloat(food.Sắt),
            sodium: toFloat(food.Natri),
            potassium: toFloat(food.Kali),
            magnesium: toFloat(food.Photpho), 
            
            // === Vitamins ===
            vitaminA: toFloat(food['Vitamin A']),
            vitaminC: toFloat(food['Vitamin C']),
            vitaminB6: toFloat(food['Vitamin B1']), 
          };

          const existing = await prisma.food.findUnique({ where: { name: name } });
          if (existing) {
            await prisma.food.update({ where: { name: name }, data: foodData });
            foodUpdated++;
          } else {
            await prisma.food.create({ data: { name: name, ...foodData } });
            foodCreated++;
          }
        }
        console.log(`✅ Foods seeding finished.`);
        resolve(); // Báo cho Promise biết là đã xong
      });
  });

  // 📊 Summary
  console.log('\n📊 Summary Report:');
  console.log(`👤 Users → ${userCreated} added, ${userUpdated} updated`);
  console.log(`📋 Profiles → ${profileCreated} added, ${profileUpdated} updated`);
  console.log(`🥗 Foods → ${foodCreated} added, ${foodUpdated} updated`); // <-- SỐ NÀY SẼ KHÁC 0
  console.log(`🏋️ Exercises → ${exerciseCreated} added, ${exerciseUpdated} updated`);
  console.log('\n✅ All seeds loaded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    console.log('❌ Failed to Load!');
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());