/*
  Warnings:

  - You are about to drop the column `portionSize` on the `Food` table. All the data in the column will be lost.
  - The `activityLevel` column on the `UserProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');

-- AlterTable
ALTER TABLE "Food" DROP COLUMN "portionSize",
ADD COLUMN     "calcium" DOUBLE PRECISION,
ADD COLUMN     "cholesterol" DOUBLE PRECISION,
ADD COLUMN     "fiber" DOUBLE PRECISION,
ADD COLUMN     "iron" DOUBLE PRECISION,
ADD COLUMN     "magnesium" DOUBLE PRECISION,
ADD COLUMN     "potassium" DOUBLE PRECISION,
ADD COLUMN     "saturatedFat" DOUBLE PRECISION,
ADD COLUMN     "sodium" DOUBLE PRECISION,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'vietnam_nin',
ADD COLUMN     "sugar" DOUBLE PRECISION,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT '100g',
ADD COLUMN     "vitaminA" DOUBLE PRECISION,
ADD COLUMN     "vitaminB12" DOUBLE PRECISION,
ADD COLUMN     "vitaminB6" DOUBLE PRECISION,
ADD COLUMN     "vitaminC" DOUBLE PRECISION,
ADD COLUMN     "vitaminD" DOUBLE PRECISION,
ADD COLUMN     "vitaminE" DOUBLE PRECISION,
ADD COLUMN     "vitaminK" DOUBLE PRECISION,
ALTER COLUMN "calories" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "activityLevel",
ADD COLUMN     "activityLevel" "ActivityLevel";

-- CreateIndex
CREATE INDEX "Food_name_idx" ON "Food"("name");
