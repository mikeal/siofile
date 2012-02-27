var fs = require('fs')
  , path = require('path')
  ;

module.exports = function (socket, files) {
  if (typeof files === 'string') files = [files] 
  if (!files) console.error('WARNING! You are allowing access to all your files.')
  function siofile (opts) {
    var file = opts.file
      , session = opts.session
      , offset = opts.offset || 0
      , size = opts.size || null
      , watch = opts.watch || false
      , interval = opts.interval || 500
      , disconnected = false
      ;
    if (files && files.indexOf(file) === -1) {
      return socket.emit('siofile-stat', {error:'Security Error. File not allowed.', session:session})
    }
    socket.on('disconnect', function () {
      disconnected = true
    })
    fs.stat(file, function (err, stat) {
      if (disconnected) return
      socket.emit('siofile-stat', {session:session, error:err, stat:stat})
      if (err) return
        
      function readchunk (offset, size) {
        fs.open(file, 'r', function (err, fd) {
          if (disconnected) return
          if (err) return socket.emit('siofile-stat', {session:session, error:err, stat:stat})
          if (size === null) {
            size = stat.size
          }
          if (offset < 0) {
            offset = stat.size + offset
          }

          var b = new Buffer(size)
          fs.read(fd, b, 0, size, offset, function (e) {
            if (disconnected) return
            if (e) return socket.emit('siofile-stat', {session:session, error:err, stat:stat})
            socket.emit('siofile-read', {session:session, data:b.toString()})
            if (watch) {
              function check () {
                fs.stat(file, function (e, s) {
                  if (s.size > stat.size) {
                    readchunk(stat.size, s.size - stat.size)
                    stat = s
                  } else {
                    setTimeout(check, interval)
                  }
                })
              }
              setTimeout(check, interval)
            }
          })
        }) 
      }
      readchunk(offset, size)
    })
  }
  return siofile
}

// var app = require('http').createServer(function (req, resp) {
//   if (req.url === '/siofile.js') return require('filed')('client.js').pipe(resp)
//   require('filed')('test.html').pipe(resp)
// })
//   , io = require('socket.io').listen(app)
//   ;
// 
// app.listen(8000)
// 
// io.sockets.on('connection', function (socket) {
//   socket.on('siofile', module.exports(socket))
// })
