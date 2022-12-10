# vite-plugin-transform

Vite plugin to handle your resources. For example, to replace occurrences by a regular expression, or resolving paths in cases where the usual tools do not help you, or something else.


<!-- vim-markdown-toc GFM -->

* [How to use in project:](#how-to-use-in-project)
* [Resolve path with plugin](#resolve-path-with-plugin)
* [Syntax](#syntax)
* [Exclude](#exclude)
* [Replace words](#replace-words)
* [Replace words alternative](#replace-words-alternative)
* [How to process bundle files](#how-to-process-bundle-files)
* [Examples](#examples)
* [Difference between versions 1.x.x and 2.x.x](#difference-between-versions-1xx-and-2xx)
  * [Resolve alias](#resolve-alias)
* [Contribution](#contribution)

<!-- vim-markdown-toc -->

## How to use in project:

Install [npm package][npm] in your project like `devDependencies`:

```shell
  npm install --save-dev vite-plugin-transform
```

In the `vite.config.js` file, import the library and add it to the plugins list:

```javascript
import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import transformPlugin from 'vite-plugin-transform'; // Look at me!

// https://vitejs.dev/config/

const alias = {
  '@':      resolve(__dirname, './src'),
  '@npm':   resolve(__dirname, 'node_modules'),
  '@root':  resolve(__dirname, '../src'),
};

const replace = {
  'replace-me': 'Hello Friends!',
};

const exclude = ['node_modules', 'Main.vue'];

export default defineConfig({
  plugins: [
    vue(),
    transformPlugin({   // add plugin
      tStart: '%{',     // set opener capture tag
      tEnd:   '}%',     // set closer capture tag
      alias,            // enable replace alias resolver
      replace,          // enable replace by key-value
      exclude,          // exclude file path patterns
      callbackArray: [  // add your functions in this array
        str => str.replace(/hello/igm, 'Привет'),
        str => str.replace(/Logout/igm, 'Выйти')
      ]
    })
  ],
  resolve: { alias },
});
```

## Resolve path with plugin

This is a rather strange way of resolving paths, initially I wrote this to dynamically import components from json, since I did not know how best to do this, but in the end, the plugin did not cope with this task, but in general we get about what was required. I don't know why you need it, but it might be useful to use.

**Example:**

_Suppose this is some data file in which there are paths that we would like to resolve:  

```JSON
// example.json:
[
  { "name": "J", "path": "{%resolve-alias key=\"@root\" path=\"user/jjjj\"%}" },
  { "name": "{%replace-me%}", "path": "{%resolve-alias key=\"@root\" path=\"user/bbbb\"%}" }
]
```

Okay. Now let's import this file and see what happens there:  

```javascript
// example.vue:
```

```javascript
<template>
  <pre>{{ex}}</pre>
  <!--/*[
    {
      "name": "J",
      "path": "D:\\serverProjects\\test-2022-08-12\\user\\jjjj"
    },
    {
      "name": "abc123",
      "path": "D:\\serverProjects\\test-2022-08-12\\user\\bbbb"
    }
  ]*/-->
</template>
<script>
import example from '@/data/example.json';
export default {
  name: 'App',
  setup() { return { ex: example }; }
}
</script>
```

The example is rather contrived and will not work with such a resolving. But maybe it will come in handy for something.

## Syntax

The default syntax is: `#{key-word}%`, `#{resolve-alias key="" path=""}%`

-   `#{` -- opening capture tag
-   `}%` -- closer capture tag

You can change default template syntax if add `tStart` and `tEnd` params in configuration:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import transformPlugin from 'vite-plugin-transform'; // Look at me!

export default defineConfig({
  plugins: [
    transformPlugin({
      tStart: '%{',
      tEnd: '}%',
      // ...other options here...
    })
  ]
});
```

After this config changes you should use something like this:

```javascript
  console.log('Hello %{friend}%!');
  console.log('%{resolve-alias path="@" path="aaaa/bbb/sdsd\cfdf/weq\qwe"}');
  //see Examples section
```

## Exclude

To exclude some paths from processing, you can write the `exclude` key with an array of values in the config, which, if found in the file path, will be ignored.

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import transformPlugin from 'vite-plugin-transform'; // Look at me!

export default defineConfig({
  plugins: [
    transformPlugin({
      // You can use regexp, because under the hood, this is used
      // new RegExp(excludePattern, 'igm').test(id)
      exclude: ['node_modules', 'app.js']
      // ...other options here...
    })
  ]
});
```

## Replace words

For simple word replacement in project files, add `replace` object with keys and values for replacement:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import transformPlugin from 'vite-plugin-transform'; // Look at me!

export default defineConfig({
  plugins: [
    transformPlugin({
      tStart: '%{',
      tEnd: '}%',
      replace: {
        'robot': '🤖',
        'smile': '😀',
        'up-vote': '👍',
      }
    })
  ]
});
```

In your working files, you can use code like this, then:

```javascript
// AppForMakePeaceAndHappy.vue
<template>
  <p>Hello %{smile}%!</p>
  <p>Look at the %{robot}%.</p>
  <button>Press %{up-vote}%</button>
</template>
<script>
import navi from '@/data/navigation';
export default { name: 'AppForMakePeaceAndHappy', };
</script>
```

## Replace words alternative

For ~~simple~~ word replacement in project files, you can use a plugin with parameters similar to the following in the `vite.config.js` configuration file:

```javascript
import { defineConfig } from 'vite';
import transformPlugin from 'vite-plugin-transform'; // Look at me!

export default defineConfig({
  plugins: [
    transformPlugin({
      callbackArray: [
        str => str.replace(/Logout!/igm, 'Goodbye!'),
        str => str.replace(/Another world/igm, 'Another replaced world'),
        str => str.replace(/again/igm, 'and again'),
      ]
    })
  ]
});
```

As you can see in the example, we add functions to the `callbackArray` array that take a string and return a string, with your possible data modification already.

However, it is worth noting that the replacement will be made only of those data that will be found in the files, in other words, reactive data, variable values will not be processed. It's pretty obvious, but don't forget about it.

## How to process bundle files
You may want to treat a file located in the public directory, as well as content that is replaced in the application. To do this, add the "replaceFiles" parameter, the value of which will be an array with the paths of the files you need to change.

Example:
```javascript
// vite.config.js
// see Examples section
//..
const replaceFiles = [
  resolve(join(__dirname, './dist/data.xml')),
  resolve(join(__dirname, './dist/data-notimported.xml')),
];
//..
export default ({ mode }) => {
  return defineConfig({
    plugins: [
      vue(),
      XMLLoader(),
      transformPlugin({ 
        tStart: '{%', tEnd:   '%}',
        replaceFiles
      }),
    ],
// ...
```

## Examples
Visit the repository with examples: https://github.com/Silksofthesoul/vite-plugin-transform-examples

##  Difference between versions 1.x.x and 2.x.x
### Resolve alias
- v1.x.x: #{resolve_aliace}%@lib#{/end}%/abc
- v2.x.x: #{resolve-alias key="@lib" path="abc"}%

## Contribution

I will be glad if you inform me about [bugs][issues], [wishes][issues], or make a [Pull Request][pr].\
...Or you can improve this document and correct literary and semantic mistakes that I could have made.\
Feel free.

[git]: https://github.com/Silksofthesoul/vite-plugin-transform

[npm]: https://www.npmjs.com/package/vite-plugin-transform

[issues]: https://github.com/Silksofthesoul/vite-plugin-transform/issues

[pr]: https://github.com/Silksofthesoul/vite-plugin-transform/pulls
