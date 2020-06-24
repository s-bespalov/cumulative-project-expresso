const express = require('express')
const menuItemRouter = express.Router({ mergeParams: true })

const sqlite = require('sqlite3')
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite')

const isValidMenuItem = menuItem => {
  const valid = menuItem.name && menuItem.inventory && menuItem.price
  if (!valid) {
    return false
  }
  if (menuItem.description === undefined) {
    menuItem.description = ''
  }
  return true
}

menuItemRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM MenuItem WHERE menu_id = $menuId'
  const params = { $menuId: req.menu.id }
  db.all(sql, params, (error, rows) => {
    if (error) {
      return next(error)
    }
    res.status(200).json({ menuItems: rows })
  })
})

menuItemRouter.post('/', (req, res, next) => {
  const newMenuItem = req.body.menuItem
  if (!isValidMenuItem(newMenuItem)) {
    return res.sendStatus(400)
  }
  const sql = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id) ' +
    'VALUES ($name, $description, $inventory, $price, $menuId)'
  const params = {
    $name: newMenuItem.name,
    $description: newMenuItem.description,
    $inventory: newMenuItem.inventory,
    $price: newMenuItem.price,
    $menuId: req.menu.id
  }
  db.run(sql, params, function (error) {
    if (error) {
      return next(error)
    }
    const sql = 'SELECT * FROM MenuItem WHERE id = $id'
    const params = { $id: this.lastID }
    db.get(sql, params, (error, row) => {
      if (error) {
        return next(error)
      }
      res.status(201).json({ menuItem: row })
    })
  })
})

menuItemRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const sql = 'SELECT * FROM MenuItem WHERE id = $id'
  const params = { $id: menuItemId }
  db.get(sql, params, (error, row) => {
    if (error) {
      return next(error)
    }
    if (!row) {
      return res.sendStatus(404)
    }
    req.menuItem = row
    next()
  })
})

menuItemRouter.put('/:menuItemId', (req, res, next) => {
  const newMenuItem = req.body.menuItem
  if (!isValidMenuItem(newMenuItem)) {
    return res.sendStatus(400)
  }
  const sql = 'UPDATE MenuItem SET name = $name, description=$description, ' +
    'inventory = $inventory, price = $price, menu_id = $menuId WHERE id = $id'
  const params = {
    $name: newMenuItem.name,
    $description: newMenuItem.description,
    $inventory: newMenuItem.inventory,
    $price: newMenuItem.price,
    $menuId: req.menu.id,
    $id: req.menuItem.id
  }
  db.run(sql, params, (error) => {
    if (error) {
      return next(error)
    }
    const sql = 'SELECT * FROM MenuItem WHERE id = $id'
    const params = { $id: req.menuItem.id }
    db.get(sql, params, (error, row) => {
      if (error) {
        return next(error)
      }
      res.status(200).json({ menuItem: row })
    })
  })
})

menuItemRouter.delete('/:menuItemId', (req, res, next) => {
  const sql = 'DELETE FROM MenuItem WHERE id = $id'
  const params = { $id: req.menuItem.id }
  db.run(sql, params, (error) => {
    if (error) {
      return next(error)
    }
    res.sendStatus(204)
  })
})

module.exports = menuItemRouter
