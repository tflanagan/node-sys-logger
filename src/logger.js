/* Copyright 2017 Tristian Flanagan
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

'use strict';

/* Dependencies */
const join = require('path').join;
const merge = require('lodash.merge');
const dateFormat = require('dateformat');
const createWriteStream = require('fs').createWriteStream;

/* Logger */
class Logger {

	constructor(options) {
		this.settings = merge({}, Logger.defaults, options || {});

		if(this.settings.logAllSTDOutput){
			this._overwriteSTD();
		}

		return this;
	}

	log(data){
		this._now = new Date();

		if(data){
			data = ('' + data).replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

			if(!data.endsWith('\n')){
				data += '\n';
			}
		}

		if(!this._verifyDestination()){
			if(this.file){
				this.file.end();
			}

			this.file = createWriteStream(this._getLogFilepath(), {
				flags: 'a'
			});
		}

		this.file.write(this._now.toISOString() + ': ' + data);

		return this;
	}

	_getLogFilepath(){
		const filename = dateFormat(this._now, this.settings.filename);

		return join(this.settings.folder, filename) + '.log';
	}

	_overwriteSTD(){
		const that = this;

		this._oldOutWrite = process.stdout.write;
		this._oldErrWrite = process.stderr.write;

		process.stdout.write = function(data){
			that.log(data);

			return that._oldOutWrite.apply(process.stdout, arguments);
		};

		process.stderr.write = function(data){
			that.log(data);

			return that._oldErrWrite.apply(process.stdout, arguments);
		};

		return this;
	}

	_verifyDestination(){
		if(!this.file){
			return false;
		}

		const truePath = this._getLogFilepath();

		if(truePath !== this.file.path){
			return false;
		}

		return true;
	}

}

/* Expose Properties */
Logger.defaults = {
	folder: join(__dirname, '..', 'tmp'),
	filename: 'yyyy-mm-dd',

	logAllSTDOutput: true
};

/* Export Module */
if(typeof(module) !== 'undefined' && module.exports){
	module.exports = Logger;
}else
if(typeof(define) === 'function' && define.amd){
	define('Logger', [], function(){
		return Logger;
	});
}
