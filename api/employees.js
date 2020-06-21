const express = require('express')
const employeesRouter = express.Router()

const sqlite = require('sqlite3')
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite')

const validEmployee = employee => {
  const valid = employee.name && employee.position && employee.wage
  if (!valid) {
    return false
  }
  if (employee.isCurrentEmployee === undefined) {
    employee.isCurrentEmployee = 1
  }
  return true
}

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
  if (!validEmployee(employee)) {
    return res.sendStatus(400)
  }
  const sql = 'INSERT INTO Employee (name, position, wage, is_current_employee)' +
    'VALUES ($name, $position, $wage, $isCurrentEmployee)'
  const data = {
    $name: employee.name,
    $position: employee.position,
    $wage: employee.wage,
    $isCurrentEmployee: employee.isCurrentEmployee
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

employeesRouter.put('/:employeeId', (req, res, next) => {
  const employee = req.body.employee
  if (!validEmployee(employee)) {
    return res.sendStatus(400)
  }
  const sql = 'UPDATE Employee SET name = $name, position = $position,' +
    'wage = $wage, is_current_employee = $isCurrentEmployee WHERE id = $id'
  const params = {
    $id: req.employee.id,
    $name: employee.name,
    $position: employee.position,
    $wage: employee.wage,
    $isCurrentEmployee: employee.isCurrentEmployee
  }
  db.run(sql, params, (error) => {
    if (error) {
      console.log('here')
      return next(error)
    }
    const sql = 'SELECT * FROM Employee WHERE id = $id'
    const params = { $id: req.employee.id }
    db.get(sql, params, (error, row) => {
      if (error) {
        return next(error)
      }
      res.status(200).json({ employee: row })
    })
  })
})

employeesRouter.delete('/:employeeId', (req, res, next) => {
  const sql = 'UPDATE Employee SET is_current_employee = 0 WHERE id = $id'
  const params = { $id: req.employee.id }
  db.run(sql, params, (error) => {
    if (error) {
      return next(error)
    }
    const sql = 'SELECT * FROM Employee WHERE id = $id'
    const params = { $id: req.employee.id }
    db.get(sql, params, (error, row) => {
      if (error) {
        return next(error)
      }
      res.status(200).json({ employee: row })
    })
  })
})

module.exports = employeesRouter
