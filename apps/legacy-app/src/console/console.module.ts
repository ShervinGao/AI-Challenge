import { Module } from '@nestjs/common';
import { ConsoleController, RootConsoleController } from './console.controller';

@Module({
    controllers: [ConsoleController, RootConsoleController],
})
export class ConsoleModule { }
