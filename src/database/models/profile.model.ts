import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Model,
} from 'sequelize';
import { v7 as uuidv7 } from 'uuid';
import { sequelize } from '../../utils/db';

export type AgeGroup = 'child' | 'teenager' | 'adult' | 'senior';

export class Profile extends Model<
  InferAttributes<Profile>,
  InferCreationAttributes<Profile>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare gender: 'male' | 'female' | null;
  declare gender_probability: number;
  declare age: number | null;
  declare age_group: AgeGroup | null;
  declare country_id: string;
  declare country_name: string;
  declare country_probability: number;
  declare created_at: CreationOptional<Date>;
}

Profile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv7,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set(value: string) {
        this.setDataValue('name', value.trim().toLowerCase());
      },
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      validate: { isIn: [['male', 'female']] },
    },
    gender_probability: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0, max: 1 },
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      validate: { min: 0 },
    },
    age_group: {
      type: DataTypes.ENUM('child', 'teenager', 'adult', 'senior'),
      allowNull: true,
      defaultValue: null,
    },
    country_id: {
      type: DataTypes.STRING(2),
      allowNull: false,
      set(value: string) {
        this.setDataValue('country_id', value.trim().toUpperCase());
      },
    },
    country_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country_probability: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0, max: 1 },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'profiles',
    timestamps: false,
    createdAt: 'created_at',
  }
);
