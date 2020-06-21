const express = require('express')
const timesheetsRouter = express.Router({ mergeParams: true })

const sqlite = require('sqlite3')
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite')

const isValidTimesheet = timesheet => {
  const valid = timesheet.hours && timesheet.rate && timesheet.date
  if (!valid) { return false }
  return true
}

timesheetsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Timesheet WHERE employee_id = $id'
  const params = { $id: req.employee.id }
  db.all(sql, params, (error, rows) => {
    if (error) {
      return next(error)
    }
    res.status(200).json({ timesheets: rows })
  })
})

timesheetsRouter.post('/', (req, res, next) => {
  const timesheet = req.body.timesheet
  if (!isValidTimesheet(timesheet)) {
    return res.sendStatus(400)
  }
  const sql = 'INSERT INTO Timesheet (hours, rate, date, employee_id) ' +
    'VALUES ($hours, $rate, $date, $employee_id)'
  const params = {
    $hours: timesheet.hours,
    $rate: timesheet.rate,
    $date: timesheet.date,
    $employee_id: req.employee.id
  }
  db.run(sql, params, function (error) {
    if (error) {
      return next(error)
    }
    const sql = 'SELECT * FROM Timesheet WHERE id = $id'
    const params = { $id: this.lastID }
    db.get(sql, params, (error, row) => {
      if (error) {
        return next(error)
      }
      res.status(201).json({ timesheet: row })
    })
  })
})

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = 'SELECT * FROM Timesheet WHERE id = $id'
  const params = { $id: timesheetId }
  db.get(sql, params, (error, row) => {
    if (error) {
      return next(error)
    }
    if (!row) {
      return res.sendStatus(404)
    }
    req.timesheet = row
    next()
  })
})

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const timesheet = req.body.timesheet
  if (!isValidTimesheet(timesheet)) {
    return res.sendStatus(400)
  }
  const sql = 'UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, ' +
   'employee_id = $employeeId WHERE id = $id'
  const params = {
    $id: req.timesheet.id,
    $hours: timesheet.hours,
    $rate: timesheet.rate,
    $date: timesheet.date,
    $employeeId: req.employee.id
  }
  db.run(sql, params, (error) => {
    if (error) {
      next(error)
    }
    const sql = 'SELECT * FROM Timesheet WHERE id = $id'
    const params = { $id: req.timesheet.id }
    db.get(sql, params, (error, row) => {
      if (error) {
        return next(error)
      }
      res.status(200).json({ timesheet: row })
    })
  })
})

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const sql = 'DELETE FROM Timesheet WHERE id = $id'
  const params = { $id: req.timesheet.id }
  db.run(sql, params, (error) => {
    if (error) {
      return next(error)
    }
    res.sendStatus(204)
  })
})

module.exports = timesheetsRouter
