const router = require('express').Router();
const staffAttendanceController = require('../controllers/staffAttendanceController');
const { authenticateToken, requireSchool } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireSchool);

router.post('/scan', staffAttendanceController.scanAttendance);
router.get('/today-status', staffAttendanceController.getTodayStatus);
router.get('/missed-hours', staffAttendanceController.getMissedHours);
router.get('/', staffAttendanceController.getAttendance);

module.exports = router;
