import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class UsdaService {
  private readonly apiKey = process.env.USDA_API_KEY;

  async getFoodByFdcId(fdcId: string) {
    if (!this.apiKey) {
      throw new Error('USDA_API_KEY is not set');
    }
    const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${this.apiKey}`;
    try {
      const response = await axios.get(url, { timeout: 10000 });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch food by fdcId');
    }
  }
}