const express = require('express')
const menusRouter = express.Router()

const sqlite = require('sqlite3')
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite')

const isValidMenu = menu => {
  if (menu.title) { return true }
  return false
}

menusRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Menu'
  db.all(sql, (error, row) => {
    if (error) {
      return next(error)
    }
    res.status(200).json({ menus: row })
  })
})

menusRouter.post('/', (req, res, next) => {
  const menu = req.body.menu
  if (!isValidMenu(menu)) {
    return res.sendStatus(400)
  }
  const sql = 'INSERT INTO Menu (title) VALUES ($title)'
  const params = { $title: menu.title }
  db.run(sql, params, function (error) {
    if (error) {
      return next(error)
    }
    const sql = 'SELECT * FROM Menu WHERE id = $id'
    const params = { $id: this.lastID }
    db.get(sql, params, (error, row) => {
      if (error) {
        return next(error)
      }
      res.status(201).json({ menu: row })
    })
  })
})

menusRouter.param('menuId', (req, res, next, menuId) => {
  const sql = 'SELECT * FROM Menu WHERE id = $id'
  const params = { $id: menuId }
  db.get(sql, params, (error, row) => {
    if (error) {
      return next(error)
    }
    if (!row) {
      return res.sendStatus(404)
    }
    req.menu = row
    next()
  })
})

menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({ menu: req.menu })
})

menusRouter.put('/:menuId', (req, res, next) => {
  const menu = req.body.menu
  if (!isValidMenu(menu)) {
    return res.sendStatus(400)
  }
  const sql = 'UPDATE Menu SET title = $title WHERE id = $id'
  const params = {
    $id: req.menu.id,
    $title: menu.title
  }
  db.run(sql, params, (error) => {
    if (error) {
      return next(error)
    }
    const sql = 'SELECT * FROM Menu WHERE id = $id'
    const params = { $id: req.menu.id }
    db.get(sql, params, (error, row) => {
      if (error) {
        return next(error)
      }
      res.status(200).json({ menu: row })
    })
  })
})

menusRouter.delete('/:menuId', (req, res, next) => {
  const sql = 'SELECT * FROM MenuItem WHERE menu_id = $id'
  const params = { $id: req.menu.id }
  db.all(sql, params, (error, rows) => {
    if (error) {
      return next(error)
    }
    if (rows.length !== 0) {
      return res.sendStatus(400)
    }
    const sql = 'DELETE FROM Menu WHERE id = $id'
    db.run(sql, params, (error) => {
      if (error) {
        return next(error)
      }
      res.sendStatus(204)
    })
  })
})

const menuItemRouter = require('./menu-items')
menusRouter.use('/:menuId/menu-items', menuItemRouter)

module.exports = menusRouter
