class ValidationStrategy {
  /**
   * @param {Buffer} imageBuffer 
   * @returns {Promise<{isValid: boolean, reason?: string}>}
   */
  async execute(imageBuffer) {
    throw new Error("Method 'execute()' must be implemented.");
  }
}

module.exports = ValidationStrategy;