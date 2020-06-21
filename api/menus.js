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

module.exports = menusRouter
