import { IsNumber, IsNotEmpty, IsUUID, IsString, Min } from 'class-validator';

export class CreateMealLogDto {
  @IsUUID('4', { message: 'foodId phải là một UUID hợp lệ.' })
  @IsNotEmpty({ message: 'foodId không được để trống.' })
  foodId!: string; 

  @IsNumber({}, { message: 'Số lượng phải là một con số.' })
  @Min(0.1, { message: 'Số lượng phải lớn hơn 0.' })
  quantity!: number; 

  @IsNotEmpty({ message: 'Loại bữa ăn không được để trống.' })
  @IsString()
  mealType!: string; 
}