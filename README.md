# vite-plugin-transform

Vite plugin to handle your resources. For example, to replace occurrences by a regular expression, or resolving paths in cases where the usual tools do not help you, or something else.

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
  '@stl':   resolve(__dirname, './src/assets/styles'),
  '@cmp':   resolve(__dirname, './src/components'),
  '@lib':   resolve(__dirname, './src/library'),
  '@data':  resolve(__dirname, './src/data'),
  '@gql':   resolve(__dirname, './src/data/graphql'),
};

const replace = {
  'replace-me': 'Hello Friends!',
};

const exclude = ['node_modules', 'Main.vue'];

export default defineConfig({
  plugins: [
    vue(),
    transformPlugin({   // add plugin
      tStart: '%{',     // set opener catch template
      tEnd:   '}%',     // set closer catch template
      alias,            // enable replace aliases resolver
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

_Suppose this is some data file in which there are paths that we would like to resolve:_

```javascript
// example.json:
// ATTENTION: there must be a '/' after the keyword
// Examples:   #{resolve_aliace}%@/abc#{/end}%
//             #{resolve_aliace}%@lib/abc#{/end}%
//             #{resolve_aliace}%@wow/abc#{/end}%
//
// Next examples will work incorrect:
//             #{resolve_aliace}%@#{/end}%/abc
//             #{resolve_aliace}%@lib#{/end}%/abc
//             #{resolve_aliace}%@wow#{/end}%/abcmark
// ...maybe its ugly or silly...
```

```JSON
[{
    "name": "Main",
    "path": "#{resolve_aliace}%@/#{/end}%"
  },
  {
    "name": "About",
    "path": "#{resolve_aliace}%@/about#{/end}%"
  },
  {
    "name": "UI",
    "path": "#{resolve_aliace}%@/ui-list#{/end}%"
  }
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
      "name": "Main",
      "path": "X:\\www\\src"
    },
    {
      "name": "About",
      "path": "X:\\www\\src\\about"
    },
    {
      "name": "UI",
      "path": "X:\\www\\src\\ui-list"
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

The default syntax is: `#{key-word}%`, `#{resolve_aliace}%key-word/#{/end}%`

-   `#{` -- opening capture tag
-   `}%` -- opening capture tag

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
  console.log('%{resolve_aliace}%key-word/%{/end}R');
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

## Replace worlds (👍)

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

## Replace worlds (👎)

For simple word replacement in project files, you can use a plugin with parameters similar to the following in the `vite.config.js` configuration file:

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

## How it work and How to use it without install plugin

In fact, you can do without installing this plugin, since `vite` provides good documentation for writing plugins, and the functionality provided is pretty easy to understand.

You can open the source code of this plugin or, even better option would be to familiarize yourself with the source code of the more famous and popular plugin.

After reading the source code, we will understand that a plugin is nothing more than a function that returns an object with properties, one of which is the name of the plugin, and the rest are presented as functions that take some arguments.

For our purposes, most of all, as it seemed to me, was the `transform` property. This is a function that takes a string as input and returns a string.

The minimal plugin looks like this:

```javascript
// vite.config.js
import { defineConfig } from 'vite';

const transformPlugin = ctx => {
  return {
    name: 'myBeautifulTransformationPlugin',
    transform: ctx => ctx.replace(/true/gim, 'false')
  };
};

export default defineConfig({
  plugins: [ transformPlugin() ]
});
```

## Dynamic import of components using path data from a separate source

If you, like me once, did not find how, for example, to describe routing data in one json file and then use the data from the file for routing and dynamic import and rendering of the menu, then here is the recipe:

```javascript
// navigation.json:
// no need use '@' aliaces
```

```JSON
[{
    "name": "Main",
    "path": "/",
    "component": "/view/main.vue"
  },
  {
    "name": "About",
    "path": "/about",
    "component": "/view/about.vue"
  },
  {
    "name": "UI",
    "path": "/ui",
    "component": "/view/ui.vue"
  }
]
```

```javascript
// router.js
import {createRouter, createWebHistory} from 'vue-router';
import navigation from '@/data/navigation.json';
const routes = navigation.map(({name, path, component}) => {
  return {
    name,
    path,
    component: () => import(/* @vite-ignore */ component)
  }
});

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
```

```javascript
// navigation.vue
<template>
  <nav>
    <router-link
    v-for="(item, index) in navi"
    :class="$style.naviLink"
    :key="index"
    :to="{name: item.name}">
      {{item.name}}
    </router-link>
  </nav>
</template>
<script>
import navi from '@/data/navigation';
export default {
  name: 'navigation',
  data() { return { navi: [] }; },
  created() { this.navi = navi; }
};
</script>
```

## Contribution

I will be glad if you inform me about [bugs][issues], [wishes][issues], or make a [Pull Request][pr].\\
...Or you can improve this document and correct literary and semantic mistakes that I could have made.\\
Feel free.

[git]: https://github.com/Silksofthesoul/vite-plugin-transform

[npm]: https://www.npmjs.com/package/vite-plugin-transform

[issues]: https://github.com/Silksofthesoul/vite-plugin-transform/issues

[pr]: https://github.com/Silksofthesoul/vite-plugin-transform/pulls
