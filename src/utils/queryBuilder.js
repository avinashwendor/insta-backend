const mongoose = require('mongoose');
const { PAGINATION } = require('../config/constants');

/**
 * QueryBuilder wraps Mongoose queries to enforce consistent patterns:
 * - No raw queries anywhere in the codebase
 * - Cursor-based pagination built in
 * - Field selection, sorting, population
 * - Chainable API
 */
class QueryBuilder {
  /**
   * @param {mongoose.Model} model - Mongoose model to query
   */
  constructor(model) {
    this.model = model;
    this._filter = {};
    this._select = '';
    this._sort = {};
    this._populate = [];
    this._limit = PAGINATION.DEFAULT_LIMIT;
    this._cursor = null;
    this._cursorDirection = -1; // -1 = descending (newest first)
    this._lean = false;
  }

  /**
   * Add equality filter conditions.
   * @param {object} conditions - MongoDB filter object
   */
  where(conditions) {
    Object.assign(this._filter, conditions);
    return this;
  }

  /**
   * Select specific fields to return.
   * @param {string} fields - Space-separated field names (prefix with - to exclude)
   */
  select(fields) {
    this._select = fields;
    return this;
  }

  /**
   * Set sort order.
   * @param {object} sortObj - e.g. { created_at: -1 }
   */
  sort(sortObj) {
    this._sort = sortObj;
    return this;
  }

  /**
   * Add a population (join).
   * @param {string|object} populateConfig - Field name or populate config object
   */
  populate(populateConfig) {
    this._populate.push(populateConfig);
    return this;
  }

  /**
   * Set result limit.
   * @param {number} limit - Max results to return
   */
  limit(limit) {
    this._limit = Math.min(
      Math.max(1, parseInt(limit, 10) || PAGINATION.DEFAULT_LIMIT),
      PAGINATION.MAX_LIMIT
    );
    return this;
  }

  /**
   * Set cursor for pagination.
   * Uses _id-based cursor for deterministic ordering.
   * @param {string} cursorId - The _id to start after
   * @param {number} [direction=-1] - Sort direction for _id: -1 (newer first) or 1 (older first)
   */
  cursor(cursorId, direction = -1) {
    if (cursorId && mongoose.Types.ObjectId.isValid(cursorId)) {
      this._cursor = cursorId;
      this._cursorDirection = direction;
    }
    return this;
  }

  /**
   * Return plain objects instead of Mongoose documents.
   */
  lean() {
    this._lean = true;
    return this;
  }

  /**
   * Execute the query and return results with pagination metadata.
   * @returns {Promise<{ data: Array, meta: { cursor: string|null, has_more: boolean } }>}
   */
  async exec() {
    if (this._cursor) {
      const cursorOperator = this._cursorDirection === -1 ? '$lt' : '$gt';
      this._filter._id = { [cursorOperator]: new mongoose.Types.ObjectId(this._cursor) };
    }

    // Default sort by _id if no sort specified
    const sortOrder = Object.keys(this._sort).length > 0
      ? this._sort
      : { _id: this._cursorDirection };

    let query = this.model
      .find(this._filter)
      .sort(sortOrder)
      .limit(this._limit + 1); // Fetch one extra to determine has_more

    if (this._select) {
      query = query.select(this._select);
    }

    for (const pop of this._populate) {
      query = query.populate(pop);
    }

    if (this._lean) {
      query = query.lean();
    }

    const results = await query;
    const hasMore = results.length > this._limit;

    if (hasMore) {
      results.pop(); // Remove the extra document
    }

    const lastItem = results[results.length - 1];
    const nextCursor = hasMore && lastItem ? lastItem._id.toString() : null;

    return {
      data: results,
      meta: {
        cursor: nextCursor,
        has_more: hasMore,
      },
    };
  }

  /**
   * Execute and return a single document.
   * @returns {Promise<object|null>}
   */
  async execOne() {
    let query = this.model.findOne(this._filter);

    if (this._select) {
      query = query.select(this._select);
    }

    for (const pop of this._populate) {
      query = query.populate(pop);
    }

    if (this._lean) {
      query = query.lean();
    }

    return query;
  }

  /**
   * Count documents matching the current filter.
   * @returns {Promise<number>}
   */
  async count() {
    return this.model.countDocuments(this._filter);
  }
}

module.exports = QueryBuilder;
