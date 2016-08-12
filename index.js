const fs = require('fs')
const StreamConcat = require('stream-concat')
const {Readable} = require('stream')
const lstream = require('length-stream')
let bsect = fs.readFileSync(`${__dirname}/bsect`)

// kernel and init are streams
module.exports = function build(kernel, init, cb) {
	let initsize
	let kpad = sectorPadding()
	let ipad = sectorPadding(l=>initsize=l)

	function finisher(dest, cb) {
		let buffer = Buffer.alloc(4)
		buffer.writeUInt32LE(initsize)
		if (dest instanceof Buffer) {
			buffer.copy(dest, 0x1bd)
		} else {
			// hopefully dest is an fd
			cb = cb || (()=>{})
			fs.write(dest, buffer, 0, 4, 0x1bd, cb)
		}
	}
	return new StreamConcat([
		bssStream(),
		kernel.pipe(lstream(l=>kpad.size(l))),
		kpad,
		init.pipe(lstream(l=>ipad.size(l))),
		ipad
	]).on('end', ()=>cb(finisher, initsize))
}

function bssStream() {
	return new Readable({
		read() {
			this.push(bsect)
			this.push(null)
		}
	})
}

function sectorPadding(lengthCB) {
	let ret = new Readable({
		read() {
			this.push(this.buffer)
			this.push(null)
		}
	})
	ret.size = function(size) {
		let padSize = 512 - size % 512
		if (lengthCB) lengthCB(size)
		this.buffer = Buffer.alloc(padSize)
	}
	return ret
}
