// ============================================================================================
// FILE: backend/src/routes/residents.routes.js
// PART OF: Back end > Routes (/api/residents)
// WHAT IT DOES: Residents and bed assignments. Staff add, edit, assign beds and move residents out;
//               the admin views, archives/restores and settles deposits.
// ============================================================================================
const express = require('../lib/router')
const residents = require('../services/residents.service')
const assignments = require('../services/assignments.service')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()
const staffUp = authorize('Admin', 'Staff')
const adminOnly = authorize('Admin')
// the daily resident work (registering, updating, bed assignment, move-out) is for the staff, the admin only reviews and archives
const staffOnly = authorize('Staff')
const id = (req) => Number(req.params.id)

router.use(authenticate, staffUp)

// bed assignments (before the /:id routes so "assignments" is not read as an id)
router.get('/assignments/all', async (req, res) => res.json(await assignments.list(req.query)))
router.get('/assignments/deposits', adminOnly, async (req, res) => res.json(await assignments.depositLedger()))
router.post('/assignments', staffOnly, async (req, res) => res.status(201).json(await assignments.assign(req.body, req)))
router.post('/assignments/:id/move-out', staffOnly, async (req, res) => res.json(await assignments.moveOut(id(req), req.body, req)))
router.post('/assignments/:id/deposit', adminOnly, async (req, res) => res.json(await assignments.settleDeposit(id(req), req.body, req)))

// residents
router.get('/', async (req, res) => res.json(await residents.list(req.query)))
router.get('/:id', async (req, res) => res.json(await residents.getOne(id(req))))
router.post('/', staffOnly, async (req, res) => res.status(201).json(await residents.create(req.body, req)))
router.put('/:id', staffOnly, async (req, res) => res.json(await residents.update(id(req), req.body, req)))
router.patch('/:id/archive', adminOnly, async (req, res) => res.json(await residents.setArchived(id(req), true, req)))
router.patch('/:id/restore', adminOnly, async (req, res) => res.json(await residents.setArchived(id(req), false, req)))

module.exports = router
