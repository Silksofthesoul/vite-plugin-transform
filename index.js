const { join } = require('path');

const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
const tStart = '#\\{';
const tEnd = '\\}%';
const clearAllKey = str => str.replace(new RegExp(`${tStart}.*${tStart}`), '');
const { stringify } = JSON;
const { entries } = Object;
const objectLength = o => entries(o).length;

const resolveAliace = (str, alias) => {
  // example: #{key-name}%
  const k = ([str], key) => `${tStart}${key ? key : str}${tEnd}`;
  const testKey = (key, str) => new RegExp(k`${key}`, 'igm').test(str);

  const key = 'resolve_aliace';
  if(alias && objectLength(alias) > 0 && testKey(key, str)) {
    // example: #{resolve_aliace}%@/your/path#{/end}%
    const re = new RegExp(`(${(k`${key}`)})(.*)(${(k`\/end`)})`, 'igm');
    str = str.replace(re, (...f) => {
      const fk = key => new RegExp(`${key}/`);
      let findedKey = entries(alias).find(([key]) => fk(key).test(f[2]));
      const base = findedKey[1];
      const add = f[2].replace(fk(findedKey[0]), '');
      const path = join(base, add);
      const ret = stringify(path).replace(/"/gim, '');
      return ret;
    });
  }
  return str;
};

const stdProcessArray = alias => {
  if(alias && objectLength(alias) > 0) {
    return [
      str => resolveAliace(str, alias),
      str => clearAllKey(str)
    ];
  }
  return [];
};

const transformPlugin = ctx => {
  const params = { alias: { }, callbackArray: [ ], ...ctx };
  const { alias, callbackArray } = params;
  return {
    name: 'transformPlugin',
    transform: ctx => pipe(
      str => str, // no idea!
      ...stdProcessArray(alias),
      ...callbackArray
    )(ctx)
  };
};

exports.transformPlugin = transformPlugin
module.exports = transformPlugin;
