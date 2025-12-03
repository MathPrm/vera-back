import { Model, DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  class SurveyResponse extends Model {
    public id!: number;
    public content!: any;
    public date!: Date;
  }

  SurveyResponse.init(
    {

      content: {
        type: DataTypes.JSONB,
        allowNull: false
      },
      date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      modelName: "SurveyResponse",
      tableName: "survey_responses",
    }
  );

  return SurveyResponse;
};