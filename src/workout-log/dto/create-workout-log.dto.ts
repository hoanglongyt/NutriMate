import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateWorkoutLogDto {
  @IsUUID('4', { message: 'exerciseId phải là một UUID hợp lệ.' })
  @IsNotEmpty({ message: 'exerciseId không được để trống.' })
  exerciseId!: string; 

  @IsNumber({}, { message: 'Thời lượng phải là một con số.' })
  @Min(1, { message: 'Thời lượng phải ít nhất là 1 phút.' })
  durationMin!: number; 
}