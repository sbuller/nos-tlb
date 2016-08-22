const fs = require('fs')
const StreamConcat = require('stream-concat')
const {Readable} = require('stream')
const lstream = require('length-stream')
const debug = require('debug')('nos-tlb')

let bsect = fs.readFileSync(`${__dirname}/bsect`)
const offsetMarker = Buffer.from('ddccbbaa', 'hex')
const initSizeOffset = bsect.lastIndexOf(offsetMarker)
debug('InitSizeOffset = %s', initSizeOffset)

// kernel and init are streams
module.exports = function build(kernel, init, cb) {
	let initsize
	let kpad = sectorPadding()
	let ipad = sectorPadding(l=>initsize=l)

	function finisher(dest, cb) {
		let buffer = Buffer.alloc(4)
		buffer.writeUInt32LE(initsize)
		if (dest instanceof Buffer) {
			buffer.copy(dest, initSizeOffset)
		} else {
			// hopefully dest is an fd
			cb = cb || (()=>{})
			fs.write(dest, buffer, 0, 4, initSizeOffset, cb)
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

module.exports.initSizeOffset = initSizeOffset
