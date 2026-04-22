'use strict';

import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';

const migration = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('profiles', {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gender_probability: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      age_group: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      country_id: {
        type: DataTypes.STRING(2),
        allowNull: false,
      },
      country_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      country_probability: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('profiles');
  },
};

export = migration;
