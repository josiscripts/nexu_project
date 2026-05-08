import { Module, Global } from '@nestjs/common';
import { CloudinaryProvider } from './providers/cloudinary.provider';
import { CloudinaryService } from './services/cloudinary.service';

@Global()
@Module({
  providers: [CloudinaryProvider, CloudinaryService],
  exports: [CloudinaryService],
})
export class CommonModule {}