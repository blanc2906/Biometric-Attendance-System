export declare class CreateUserLogDto {
    date: Date;
    time_in: string;
    time_out?: string;
}
export declare class UpdateUserLogDto {
    date?: Date;
    time_in?: string;
    time_out: string;
}
