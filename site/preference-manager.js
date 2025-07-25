/**
 * Manages user preferences using localStorage.
 */
class PreferenceManager {
  constructor(storage = localStorage) {
    this.storage = storage;
  }

  /**
   * Gets a preference value.
   * @param {string} key - The preference key.
   * @param {*} defaultValue - The default value if the key is not found.
   * @returns {*} The preference value.
   */
  get(key, defaultValue) {
    const value = this.storage.getItem(key);
    if (value === null) {
      return defaultValue;
    }
    try {
      return JSON.parse(value);
    } catch (e) {
      console.error(`Error parsing preference key "${key}":`, e);
      return defaultValue;
    }
  }

  /**
   * Sets a preference value.
   * @param {string} key - The preference key.
   * @param {*} value - The value to set.
   */
  set(key, value) {
    this.storage.setItem(key, JSON.stringify(value));
  }
}
