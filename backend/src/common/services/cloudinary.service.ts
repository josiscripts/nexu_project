import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as CloudinaryV2, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { CLOUDINARY } from '../providers/cloudinary.provider';

export interface UploadResult {
  secure_url: string;
  public_id: string;
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(CLOUDINARY) private cloudinary: typeof CloudinaryV2,
    private configService: ConfigService,
  ) {}

  /**
   * Sube una imagen a Cloudinary usando upload_stream (eficiente para buffers)
   * @param file Archivo recibido via Multer (memory storage)
   * @returns Promesa con secure_url y public_id
   */
  async uploadImage(file: MulterFile): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('El archivo debe ser una imagen');
    }

    const uploadPreset = this.configService.get<string>('CLOUDINARY_UPLOAD_PRESET');

    return new Promise<UploadResult>((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          upload_preset: uploadPreset,
          folder: 'nexu_posts',
          resource_type: 'image',
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error || !result) {
            return reject(
              new BadRequestException(
                `Error al subir imagen a Cloudinary: ${error?.message || 'Unknown error'}`,
              ),
            );
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Elimina una imagen de Cloudinary por su public_id
   * @param publicId ID público de la imagen a eliminar
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await this.cloudinary.uploader.destroy(publicId);
    } catch {
      throw new BadRequestException(`Error al eliminar imagen de Cloudinary`);
    }
  }
}