import { IsDateString, IsOptional } from 'class-validator';

export class GetSummaryDto {
  @IsDateString({}, { message: 'Định dạng ngày phải là YYYY-MM-DD' })
  @IsOptional()
  date?: string;
}