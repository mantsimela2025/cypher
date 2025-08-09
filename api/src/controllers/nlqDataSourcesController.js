const db = require('../db'); // Assuming db is a configured database client

// Get all data sources
exports.getAllDataSources = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM nlq_data_sources ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// Get a single data source by id
exports.getDataSourceById = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result = await db.query('SELECT * FROM nlq_data_sources WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Data source not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Create a new data source
exports.createDataSource = async (req, res, next) => {
  const { name, type, enabled, schema, description, sample_data } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO nlq_data_sources (name, type, enabled, schema, description, sample_data)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, type, enabled, schema, description, sample_data]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Update a data source by id
exports.updateDataSource = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  const { name, type, enabled, schema, description, sample_data } = req.body;
  try {
    const result = await db.query(
      `UPDATE nlq_data_sources
       SET name = $1, type = $2, enabled = $3, schema = $4, description = $5, sample_data = $6
       WHERE id = $7 RETURNING *`,
      [name, type, enabled, schema, description, sample_data, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Data source not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Delete a data source by id
exports.deleteDataSource = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result = await db.query('DELETE FROM nlq_data_sources WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Data source not found' });
    }
    res.json({ message: 'Data source deleted successfully' });
  } catch (err) {
    next(err);
  }
};
