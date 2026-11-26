// ============================================================================================
// FILE: backend/src/routes/visitors.routes.js
// PART OF: Back end > Routes (/api/visitors)
// WHAT IT DOES: Visitor log. Staff check visitors in and out; the admin can view the log.
// ============================================================================================
const express = require('../lib/router')
const visitors = require('../services/visitors.service')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()
// the front desk (staff) records visitors, the admin can only read the log
const staffOnly = authorize('Staff')
router.use(authenticate, authorize('Admin', 'Staff'))

router.get('/', async (req, res) => res.json(await visitors.list(req.query)))
router.post('/', staffOnly, async (req, res) => res.status(201).json(await visitors.checkIn(req.body, req)))
router.patch('/:id/check-out', staffOnly, async (req, res) => res.json(await visitors.checkOut(Number(req.params.id), req)))

module.exports = router
