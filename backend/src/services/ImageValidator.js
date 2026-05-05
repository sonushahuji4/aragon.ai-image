class ImageValidator {
  constructor() {
    this.strategies = [];
  }

  addStrategy(strategy) {
    this.strategies.push(strategy);
  }

  async validateAll(imageBuffer) {
    const metadata = {};
    for (const strategy of this.strategies) {
      const result = await strategy.execute(imageBuffer);
      if (!result.isValid) {
        return { isValid: false, reason: result.reason };
      }
      // Collect metadata if returned
      if (result.metadata) {
        Object.assign(metadata, result.metadata);
      }
    }
    return { isValid: true, metadata };
  }
}

module.exports = ImageValidator;