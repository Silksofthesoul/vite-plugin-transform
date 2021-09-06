const { join } = require('path');

const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

let [tStart, tEnd] = ['#\\{', '\\}%'];

const clearAllKey = str => str.replace(new RegExp(`${tStart}.*${tEnd}`), '');
const { stringify } = JSON;
const { entries } = Object;

const objectLength = o => entries(o).length;

const k = ([str], key) => `${tStart}${key ? key : str}${tEnd}`;

const resolveAliace = (str, alias) => {
  // example: #{key-name}%
  const testKey = (key, str) => new RegExp(k`${key}`, 'igm').test(str);

  const key = 'resolve_aliace';
  if(alias && objectLength(alias) > 0 && testKey(key, str)) {
    // example: #{resolve_aliace}%@/your/path#{/end}%
    const re = new RegExp(`(${(k`${key}`)})(.*)(${(k`\/end`)})`, 'igm');
    str = str.replace(re, (...f) => {
      const fk = key => new RegExp(`${key}/`);
      let findedKey = entries(alias).find(([key]) => fk(key).test(f[2]));
      if(findedKey) {
        const base = findedKey[1];
        const add = f[2].replace(fk(findedKey[0]), '');
        const path = join(base, add);
        const ret = stringify(path).replace(/"/gim, '');
        return ret;
      } else {
        return ``;
      }
    });
  }
  return str;
};

const replaceProcess = (str, replaceArray) => {
  for (let [key, value] of entries(replaceArray)) str = str.replace(new RegExp(k`${key}`, 'igm'), value);
  return str;
};

const stdProcessArray = ({alias, replace}) => {
  if(alias && objectLength(alias) > 0) {
    return [
      str => resolveAliace(str, alias),
      str => replaceProcess(str, replace),
      str => clearAllKey(str)
    ];
  }
  return [];
};

const transformPlugin = ctx => {
  const params = {
    alias: { },
    replace: { },
    callbackArray: [ ],
    exclude: [ ],
    tStart,
    tEnd,
    ...ctx
  };

  tStart = params.tStart;
  tEnd = params.tEnd;

  const {
    alias,
    replace,
    exclude,
    callbackArray
  } = params;

  const checkExcludeStatus = id => {
    for (let excludePattern of exclude) if(new RegExp(excludePattern, 'igm').test(id)) return true
    return false
  }

  return {
    name: 'transformPlugin',
    transform: (ctx, id) => {
      if(checkExcludeStatus(id)) return false;
      return pipe(
        str => str, // no idea!
        ...stdProcessArray(({alias, replace})),
        ...callbackArray
      )(ctx)
    }
  };
};

exports.transformPlugin = transformPlugin
module.exports = transformPlugin;
