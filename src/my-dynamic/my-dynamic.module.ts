import { DynamicModule, Module } from "@nestjs/common";
import { config } from "process";

export type MyDynamicModuleConfigs = {
    apiKey: string;
    apiUrl: string;
}

export const MY_DYNAMIC_CONFIG = 'MY_DYNAMIC_CONFIG';


@Module({})
export class MyDynamicModule {
    static register(configs: MyDynamicModuleConfigs): DynamicModule {
        //Aqui eu vou usar minhas configurações
        console.log('MyDynamicModule', configs);

        return {
            module: MyDynamicModule,
            imports: [],
            providers: [
                {
                    provide: MY_DYNAMIC_CONFIG,
                    useValue: configs,
                }
            ],
            controllers: [],
            exports: [MY_DYNAMIC_CONFIG],
        }
    }
}