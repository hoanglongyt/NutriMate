import { ActivityLevel } from '@prisma/client';

export const userProfileSeedData = [
  {
    heightCm: 170,
    weightKg: 65,
    targetWeightKg: 62,
    activityLevel: ActivityLevel.LIGHT,
  },
 
  {
    heightCm: 160,
    weightKg: 55,
    targetWeightKg: 53,
    activityLevel: ActivityLevel.MODERATE,
  },
];