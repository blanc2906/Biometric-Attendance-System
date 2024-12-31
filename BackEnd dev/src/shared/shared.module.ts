import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptHelper } from './helpers/encrypt.helper';
import { FileHandlingHelper } from './helpers/file-handling.helper';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [EncryptHelper, FileHandlingHelper],
    exports: [EncryptHelper, FileHandlingHelper]
})
export class SharedModule {}