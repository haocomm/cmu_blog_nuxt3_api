const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

module.exports = {
  changeToWebp: async (req) => {
    const { filename } = req.file
    const newFilename = filename.replace(/\.[^/.]+$/, '')
    const newPath = path.join(req.file.destination, `${newFilename}.webp`)
    await sharp(req.file.path).webp().toFile(newPath)
    fs.unlinkSync(req.file.path)
    return newPath
  },
  removeTmpFile: (req) => {
    if (req.file) {
      const { filename } = req.file
      const newFilename = filename.replace(/\.[^/.]+$/, '')
      const newPath = path.join(req.file.destination, `${newFilename}.webp`)
      if (fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error(err)
          }
        })
      } else if (fs.existsSync(newPath)) {
        fs.unlink(newPath, (err) => {
          if (err) {
            console.error(err)
          }
        })
      }
    }
  }
}
