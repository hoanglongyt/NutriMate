import { PrismaClient } from '@prisma/client';
import { foodSeedData } from "./seeds/foods.seed";
import { exerciseSeedData } from "./seeds/exercises.seed";

const prisma = new PrismaClient();

async function main() {
    console.log("Started loading seeds data");

    let foodCreated = 0;
    let foodUpdated = 0;
    let exerciseCreated = 0;
    let exerciseUpdated = 0;


//Foods
    console.log("🥗 Seeding Foods...");
    for (const food of foodSeedData) {
    const existing = await prisma.food.findUnique({ where: { name: food.name } });

    if (existing) {
      await prisma.food.update({
        where: { name: food.name },
        data: {
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          portionSize: food.portionSize,
        },
      });
      console.log(`🔁 Updated food: ${food.name}`);
      foodUpdated++;
    } else {
      await prisma.food.create({ data: food });
      console.log(`✅ Added new food: ${food.name}`);
      foodCreated++;
    }
  }


//Exercise
   console.log('\n🏋️ Seeding Exercises...');
  for (const exercise of exerciseSeedData) {
    const existing = await prisma.exercise.findUnique({ where: { name: exercise.name } });

    if (existing) {
      await prisma.exercise.update({
        where: { name: exercise.name },
        data: {
          caloriesBurnedPerHour: exercise.caloriesBurnedPerHour,
          type: exercise.type,
        },
      });
      console.log(`🔁 Updated exercise: ${exercise.name}`);
      exerciseUpdated++;
    } else {
      await prisma.exercise.create({ data: exercise });
      console.log(`✅ Added new exercise: ${exercise.name}`);
      exerciseCreated++;
    }
  }


//Summary
  console.log('\n📊 Summary Report:');
  console.log(`🥗 Foods → ${foodCreated} added, ${foodUpdated} updated`);
  console.log(`🏋️ Exercises → ${exerciseCreated} added, ${exerciseUpdated} updated`);
  console.log('\n✅ All seeds loaded successfully!');

}
main()
    .catch((e) => {
        console.error(e);
        console.log("Failed to Load!");
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());