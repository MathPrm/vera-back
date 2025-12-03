import { Dialect } from 'sequelize';
export interface DbConfig {
    HOST: string;
    USER: string;
    PASSWORD: string;
    DB: string;
    dialect: Dialect;
    pool: {
        max: number;
        min: number;
        acquire: number;
        idle: number;
    };
    port?: number;
}
declare const dbConfig: DbConfig;
export default dbConfig;
//# sourceMappingURL=db.config.d.ts.map