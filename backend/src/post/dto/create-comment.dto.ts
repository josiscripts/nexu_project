import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  content: string;
}
