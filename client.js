window.siofile = function siofile (socket) {
  var sessions = {}
    , exports = {}
    ;
  exports.read = function (opts, cb) {
    if (typeof opts === 'string') opts = {file:opts}
    opts.session = Math.floor(Math.random()*1111111111)
    sessions[opts.session] = cb
    socket.emit('siofile', opts)
  }
  exports.watch = function (opts, cb) {
    if (typeof opts === 'string') opts = {file:opts}
    opts.session = Math.floor(Math.random()*1111111111)
    opts.watch = true
    sessions[opts.session] = cb
    socket.emit('siofile', opts)
  }
  
  socket.on('siofile-stat', function (obj) {
    if (obj.error) sessions[obj.session](obj.error)
  })
  socket.on('siofile-read', function (obj) {
    if (!sessions[obj.session]) {
      throw new Error('No session with id = '+obj.session)
    }
    sessions[obj.session](null, obj.data)
  })
  
  return exports
}