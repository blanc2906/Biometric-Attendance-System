import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptHelper } from './helpers/encrypt.helper';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [EncryptHelper],
    exports: [EncryptHelper]
})
export class SharedModule {}