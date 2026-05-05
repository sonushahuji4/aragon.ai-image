const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Image extends Model {}

Image.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID, // To group images by user
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED'),
    defaultValue: 'PENDING',
  },
  tempS3Key: {
    type: DataTypes.STRING,
    allowNull: false, // Where it sits before processing
  },
  finalS3Key: {
    type: DataTypes.STRING,
    allowNull: true, // Only populated if ACCEPTED
  },
  rejectionReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pHash: {
    type: DataTypes.STRING, // Perceptual hash for similarity checks
    allowNull: true,
  }
}, { sequelize, modelName: 'Image' });

module.exports = Image;