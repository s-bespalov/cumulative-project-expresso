const express = require('express')
const employeesRouter = express.Router()

const sqlite = require('sqlite3')
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite')

employeesRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Employee WHERE is_current_employee = 1'
  db.all(sql, (error, rows) => {
    if (error) {
      return next(error)
    }
    res.status(200).json({ employees: rows })
  })
})

employeesRouter.post('/', (req, res, next) => {
  const employee = req.body.employee
  const valid = employee.name && employee.position && employee.wage
  if (!valid) {
    return res.sendStatus(400)
  }
  if (!employee.isCurrentlyEmployee) {
    employee.isCurrentlyEmployee = 1
  }
  const sql = 'INSERT INTO Employee (name, position, wage, is_current_employee)' +
    'VALUES ($name, $position, $wage, $isCurrentlyEmployee)'
  const data = {
    $name: employee.name,
    $position: employee.position,
    $wage: employee.wage,
    $isCurrentlyEmployee: employee.isCurrentlyEmployee
  }
  db.run(sql, data, function (error) {
    if (error) {
      return next(error)
    }
    const sql = 'SELECT * FROM Employee WHERE id = $id'
    const data = { $id: this.lastID }
    db.get(sql, data, (error, row) => {
      if (error) {
        return next(error)
      }
      res.status(201).json({ employee: row })
    })
  })
})

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = 'SELECT * FROM Employee WHERE id = $id'
  const params = { $id: employeeId }
  db.get(sql, params, (error, row) => {
    if (error) {
      return next(error)
    }
    if (!row) {
      return res.sendStatus(404)
    }
    req.employee = row
    next()
  })
})

employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({ employee: req.employee })
})

module.exports = employeesRouter
