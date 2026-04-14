const QueryBuilder = require('../utils/queryBuilder');

/**
 * Base repository providing common CRUD operations via QueryBuilder.
 * All data access MUST go through this or its subclasses.
 * No raw Mongoose queries are permitted outside repositories.
 */
class BaseRepository {
  /**
   * @param {import('mongoose').Model} model - Mongoose model
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Create a new QueryBuilder instance for this model.
   * @returns {QueryBuilder}
   */
  query() {
    return new QueryBuilder(this.model);
  }

  /**
   * Create a single document.
   * @param {object} data - Document fields
   * @returns {Promise<object>}
   */
  async create(data) {
    const doc = await this.model.create(data);
    return doc;
  }

  /**
   * Find a document by its _id.
   * @param {string} id - Document ID
   * @param {string} [select] - Fields to select
   * @returns {Promise<object|null>}
   */
  async findById(id, select = '') {
    const query = this.query().where({ _id: id });
    if (select) {
      query.select(select);
    }
    return query.lean().execOne();
  }

  /**
   * Find a single document matching conditions.
   * @param {object} conditions - Filter conditions
   * @param {string} [select] - Fields to select
   * @returns {Promise<object|null>}
   */
  async findOne(conditions, select = '') {
    const query = this.query().where(conditions);
    if (select) {
      query.select(select);
    }
    return query.lean().execOne();
  }

  /**
   * Find documents with cursor-based pagination.
   * @param {object} conditions - Filter conditions
   * @param {object} options - Query options
   * @param {string} [options.cursor] - Pagination cursor
   * @param {number} [options.limit] - Results per page
   * @param {string} [options.select] - Fields to select
   * @param {object} [options.sort] - Sort order
   * @param {Array} [options.populate] - Population configs
   * @returns {Promise<{ data: Array, meta: object }>}
   */
  async findMany(conditions, options = {}) {
    const {
      cursor,
      limit,
      select,
      sort,
      populate = [],
    } = options;

    const query = this.query().where(conditions).lean();

    if (cursor) query.cursor(cursor);
    if (limit) query.limit(limit);
    if (select) query.select(select);
    if (sort) query.sort(sort);

    for (const pop of populate) {
      query.populate(pop);
    }

    return query.exec();
  }

  /**
   * Update a document by ID using Mongoose's findByIdAndUpdate.
   * Returns the updated document.
   * @param {string} id - Document ID
   * @param {object} updateData - Fields to update
   * @param {object} [options] - Mongoose options
   * @returns {Promise<object|null>}
   */
  async updateById(id, updateData, options = {}) {
    return this.model.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true, ...options }
    );
  }

  /**
   * Update a single document matching conditions.
   * @param {object} conditions - Filter conditions
   * @param {object} updateData - Fields to update
   * @returns {Promise<object|null>}
   */
  async updateOne(conditions, updateData) {
    return this.model.findOneAndUpdate(
      conditions,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  /**
   * Increment/decrement numeric fields atomically.
   * @param {string} id - Document ID
   * @param {object} increments - e.g. { followers_count: 1 } or { followers_count: -1 }
   * @returns {Promise<object|null>}
   */
  async incrementById(id, increments) {
    return this.model.findByIdAndUpdate(
      id,
      { $inc: increments },
      { new: true }
    );
  }

  /**
   * Delete a document by ID.
   * @param {string} id - Document ID
   * @returns {Promise<object|null>}
   */
  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  /**
   * Delete documents matching conditions.
   * @param {object} conditions - Filter conditions
   * @returns {Promise<{ deletedCount: number }>}
   */
  async deleteMany(conditions) {
    return this.model.deleteMany(conditions);
  }

  /**
   * Count documents matching conditions.
   * @param {object} conditions - Filter conditions
   * @returns {Promise<number>}
   */
  async countDocuments(conditions = {}) {
    return this.query().where(conditions).count();
  }
}

module.exports = BaseRepository;
