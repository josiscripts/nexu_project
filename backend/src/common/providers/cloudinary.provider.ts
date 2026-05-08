import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryConfig } from '../config/cloudinary.config';

export const CLOUDINARY = 'CLOUDINARY';

export const CloudinaryProvider: FactoryProvider<typeof cloudinary> = {
  provide: CLOUDINARY,
  useFactory: (configService: ConfigService) => {
    const config = configService.get<CloudinaryConfig>('cloudinary');

    cloudinary.config({
      cloud_name: config?.cloudName,
      api_key: config?.apiKey,
      api_secret: config?.apiSecret,
      secure: true,
    });

    return cloudinary;
  },
  inject: [ConfigService],
};