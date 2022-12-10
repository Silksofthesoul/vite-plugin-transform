const { join, resolve } = require('path');
const fs = require('fs');

const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

let [tStart, tEnd] = ['#\\{', '\\}%'];

const clearAllKey = str => str.replace(new RegExp(`${tStart}.*${tEnd}`), '');
const { stringify: s=null } = JSON;
const { entries, keys } = Object;

const objectLength = o => entries(o).length;

const k = ([str], key) => `${tStart}${key ? key : str}${tEnd}`;

const resolveAliases = (str, alias) => {
  // example: #{key-name}%
  const key = 'resolve-alias';
  const re = new RegExp(`${tStart}\s*?${key}\\s*?(.*?)\s*?${tEnd}`, 'igm');
  const rePathParam = /(path\s*=\s*\\{0,2}["'`])(.*?)(\\{0,2}["'`][\sA-Z]*)/;
  const reKeyParam = /(key\s*=\s*\\{0,2}["'`])(.*?)(\\{0,2}["'`][\sa-zA-Z]*)/;
  const qNormalize = str => str.replace(/\\/gim, '\\\\');
  if(alias && objectLength(alias) > 0 && re.test(str)) {
    // example: #{resolve-alias key="@" path="aa/bb/cc"}%
    str = str.replace(re, (...f) => {
      f.splice(f.length - 1, 1);
      let base = f[0];
      const keyParam = reKeyParam.exec(base);
      const pathParam = rePathParam.exec(base);
      const valAlias = alias[keyParam[2]];
      const valPath = pathParam ? pathParam[2] : '';
      if(!valAlias) return str;
      const ret = qNormalize(resolve(join(valAlias, valPath)));
      return ret;
    });
  }
  return str;
};

const replaceProcess = (str, replaceArray) => {
  let res = str;
  for (let [key, value] of entries(replaceArray)) res = res.replace(new RegExp(k`${key}`, 'igm'), value);
  return res;
};

const stdProcessArray = ({alias, replace}) => {
  const aCond = alias && objectLength(alias) > 0;
  const rCond = replace && objectLength(replace) > 0;
  let res = [];
  if(aCond) res.push(str => resolveAliases(str, alias));
  if(rCond) res.push(str => replaceProcess(str, replace));
  res.push(str => clearAllKey(str, replace));
  return res;
};

const checkFile = pathToFile => new Promise( r => fs.access(pathToFile, fs.constants.F_OK, e => r(!e)));

const processFile = async (pathToFile, alias, replace, callbackArray) => {
  const fsp = fs.promises;
  let isError = false;
  const makeError = (...args) => {
    console.error(...args);
    isError = true;
  };

  const fileRes = await fsp.readFile(filePath, {flag: 'r'})
  .catch(e => makeError('Error!', e));
  const fileContent = fileRes.toString();

  const fileContentModified = transform(fileContent, alias, replace, callbackArray);
 
  await fsp.writeFile(pathToFile, fileContentModified)
  .catch(e => makeError('Error!', e));

  if(isError === false) console.log(`File transformed: ${pathToFile}`);
  else console.warn('An error occurred in the process', filePath);
};

const transform = (str, alias, replace, callbackArray) => {
  let processArray = stdProcessArray({alias, replace});
  let r = pipe( ...processArray, ...callbackArray)(str);
  return r;
}

const checkExcludeStatus = (id, exclude) => {
  for (let excludePattern of exclude) if(new RegExp(excludePattern, 'igm').test(id)) return true
  return false
}

const transformPlugin = props => {
  const {
    alias = { },
    callbackArray = [ ],
    exclude = [ ],
    replace = { },
    replaceFiles = [],
    tEnd: _tEnd = null,
    tStart: _tStart = null
  } = props;

  if(_tStart !== null) tStart = _tStart;
  if(_tEnd !== null) tEnd = _tEnd;


  return {
    name: 'transformPlugin',
    transform: (str, id) => {
      if(checkExcludeStatus(id, exclude)) return false;
      return transform(str, alias, replace, callbackArray);
    },
    async closeBundle() {
      if(replaceFiles.length > 0) {
        for (filePath of replaceFiles) {
          let isFileExist = await checkFile(filePath);
          if(isFileExist) await processFile(filePath, alias, replace, callbackArray);
          else console.warn(`Warning! File ${filePath} not found!`);
        }
      }
    }
  };
};

exports.transformPlugin = transformPlugin
module.exports = transformPlugin;
