const LIMIT = 20;

function getPage(req) {
  const p = Number.parseInt(req.query.page, 10);
  return Number.isSafeInteger(p) && p > 0 ? p : 1;
}

function pageInfo(total, page, limit = LIMIT) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const current = Math.min(page, totalPages);
  return { page: current, totalPages, total, limit, offset: (current - 1) * limit };
}

// escape % and _ so user text can't act as wildcards
function likeTerm(s) {
  return '%' + String(s).replace(/[\\%_]/g, '\\$&') + '%';
}

module.exports = { getPage, pageInfo, likeTerm };
