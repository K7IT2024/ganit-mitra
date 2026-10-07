// Vercel: GET /api/test (diagnostic)
const { test } = require("../lib/tutor");
module.exports = async (_, res) => res.status(200).json(await test());
