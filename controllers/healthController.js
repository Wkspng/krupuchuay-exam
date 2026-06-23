const mongoose = require('mongoose');

function getHealth(req, res) {
  return res.json({
    status: 'ok',
    database: mongoose.connection.name || 'krupuchuay',
  });
}

module.exports = { getHealth };
