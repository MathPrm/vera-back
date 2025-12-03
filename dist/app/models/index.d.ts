import { Sequelize } from 'sequelize';
interface DbContext {
    Sequelize: typeof Sequelize;
    sequelize: Sequelize;
    items?: any;
    verifications?: any;
}
declare const db: DbContext;
export default db;
//# sourceMappingURL=index.d.ts.map