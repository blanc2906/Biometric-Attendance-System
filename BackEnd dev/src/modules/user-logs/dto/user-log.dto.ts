import { IsDate, IsString, IsOptional } from 'class-validator';

export class CreateUserLogDto {
    @IsDate()
    date: Date;

    @IsString()
    time_in: string;

    @IsOptional()
    @IsString()
    time_out?: string;
}

export class UpdateUserLogDto {
    @IsOptional()
    @IsDate()
    date?: Date;

    @IsOptional()
    @IsString()
    time_in?: string;

    @IsString()
    time_out: string;
}

export class UserLogResponseDto {
    id: string;
    user_name: string;
    user_id: string;
    date: Date;
    time_in: string;
    time_out?: string;
} 