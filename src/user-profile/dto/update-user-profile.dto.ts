import { IsNumber, IsOptional, Min, IsEnum } from 'class-validator';

export enum ActivityLevel {
  SEDENTARY = 'SEDENTARY', 
  LIGHT = 'LIGHT', 
  MODERATE = 'MODERATE', 
  ACTIVE = 'ACTIVE', 
  VERY_ACTIVE = 'VERY_ACTIVE',
}

export class UpdateUserProfileDto {

  @IsNumber({}, { message: 'Chiều cao phải là một con số.' })
  @Min(1, { message: 'Chiều cao phải lớn hơn 0.' })
  @IsOptional() 
  heightCm?: number;

  @IsNumber({}, { message: 'Cân nặng phải là một con số.' })
  @Min(1, { message: 'Cân nặng phải lớn hơn 0.' })
  @IsOptional()
  weightKg?: number;

  @IsNumber({}, { message: 'Cân nặng mục tiêu phải là một con số.' })
  @Min(1, { message: 'Cân nặng mục tiêu phải lớn hơn 0.' })
  @IsOptional()
  targetWeightKg?: number;

  @IsEnum(ActivityLevel, {
    message:
      'Mức độ hoạt động phải là một trong các giá trị: SEDENTARY, LIGHT, MODERATE, ACTIVE, VERY_ACTIVE',
  })
  @IsOptional()
  activityLevel?: ActivityLevel;
}