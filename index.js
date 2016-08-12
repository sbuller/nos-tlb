const fs = require('fs')
const StreamConcat = require('stream-concat')
const {Readable} = require('stream')
const lstream = require('length-stream')
let bsect = fs.readFileSync('./bsect')

// kernel and init are streams
module.exports = function build(kernel, init) {
	let kpad = sectorPadding()
	let ipad = sectorPadding()
	return new StreamConcat([
		bssStream(),
		kernel.pipe(lstream(l=>kpad.size(l))),
		kpad,
		init.pipe(lstream(l=>ipad.size(l))),
		ipad
	])
}

function bssStream() {
	return new Readable({
		read() {
			this.push(bsect)
		}
	})
}

function sectorPadding() {
	let ret = new Readable({
		read() {
			this.push(this.buffer)
		}
	})
	ret.size = function(size) {
		this.uffer = Buffer.alloc(512 - size % 512)
	}
	return ret
}
