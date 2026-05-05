const Image = require('../models/Image');

class ImageRepository {
  async create(data) {
    return await Image.create(data);
  }

  async findById(id) {
    return await Image.findByPk(id);
  }

  async findByUserId(userId) {
    return await Image.findAll({ where: { userId } });
  }

  async updateStatus(id, status, reason = null) {
    return await Image.update(
      { status, rejectionReason: reason },
      { where: { id } }
    );
  }

  async markAsAccepted(id, finalKey, pHash) {
    return await Image.update(
      {
        status: 'ACCEPTED',
        finalS3Key: finalKey,
        pHash,
        rejectionReason: null
      },
      { where: { id } }
    );
  }
}

module.exports = ImageRepository;